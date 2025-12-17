import { supabase } from './supabase';
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';

// Team Collaboration Service for EVIDENRA Ultimate
// Enables real-time collaboration, project sharing, and team management

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: string;
  lastActive: string;
}

export interface TeamInvitation {
  id: string;
  projectId: string;
  email: string;
  role: 'editor' | 'viewer';
  inviterName: string;
  inviterEmail: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  discount: number;
  createdAt: string;
  expiresAt: string;
}

// Realtime types
export interface PresenceUser {
  id: string;
  email: string;
  name: string;
  online_at: string;
  currentDocument?: string;
  currentCoding?: string;
}

export interface RealtimeUpdate {
  type: 'coding' | 'document' | 'comment' | 'member';
  action: 'insert' | 'update' | 'delete';
  payload: any;
  userId: string;
  timestamp: string;
}

export type RealtimeCallback = (update: RealtimeUpdate) => void;
export type PresenceCallback = (users: PresenceUser[]) => void;

export interface SharedProject {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerEmail: string;
  sharedWith: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface CollaborationComment {
  id: string;
  projectId: string;
  userId: string;
  userEmail: string;
  content: string;
  documentId?: string;
  codingId?: string;
  createdAt: string;
  resolved: boolean;
}

export class TeamCollaborationService {
  private projectChannels: Map<string, RealtimeChannel> = new Map();
  private realtimeCallbacks: Map<string, RealtimeCallback[]> = new Map();
  private presenceCallbacks: Map<string, PresenceCallback[]> = new Map();
  private currentUser: PresenceUser | null = null;

  // Subscribe to realtime updates for a project
  async subscribeToProject(
    projectId: string,
    onUpdate: RealtimeCallback,
    onPresenceChange?: PresenceCallback
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get current user
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      this.currentUser = {
        id: user.user.id,
        email: user.user.email || '',
        name: user.user.email?.split('@')[0] || 'Unknown',
        online_at: new Date().toISOString()
      };

      // Check if already subscribed
      if (this.projectChannels.has(projectId)) {
        // Add callbacks to existing subscription
        if (!this.realtimeCallbacks.has(projectId)) {
          this.realtimeCallbacks.set(projectId, []);
        }
        this.realtimeCallbacks.get(projectId)!.push(onUpdate);

        if (onPresenceChange) {
          if (!this.presenceCallbacks.has(projectId)) {
            this.presenceCallbacks.set(projectId, []);
          }
          this.presenceCallbacks.get(projectId)!.push(onPresenceChange);
        }
        return { success: true, error: null };
      }

      // Create new channel for project
      const channel = supabase.channel(`project:${projectId}`, {
        config: {
          presence: { key: user.user.id }
        }
      });

      // Setup presence tracking
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users = this.parsePresenceState(state);
        const callbacks = this.presenceCallbacks.get(projectId) || [];
        callbacks.forEach(cb => cb(users));
      });

      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      });

      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      });

      // Listen for broadcast messages (coding updates, comments, etc.)
      channel.on('broadcast', { event: 'project_update' }, ({ payload }) => {
        const update = payload as RealtimeUpdate;
        const callbacks = this.realtimeCallbacks.get(projectId) || [];
        callbacks.forEach(cb => cb(update));
      });

      // Subscribe to the channel
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
          await channel.track(this.currentUser!);
        }
      });

      // Store channel and callbacks
      this.projectChannels.set(projectId, channel);
      this.realtimeCallbacks.set(projectId, [onUpdate]);
      if (onPresenceChange) {
        this.presenceCallbacks.set(projectId, [onPresenceChange]);
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  // Unsubscribe from project updates
  async unsubscribeFromProject(projectId: string): Promise<void> {
    const channel = this.projectChannels.get(projectId);
    if (channel) {
      await channel.unsubscribe();
      this.projectChannels.delete(projectId);
      this.realtimeCallbacks.delete(projectId);
      this.presenceCallbacks.delete(projectId);
    }
  }

  // Broadcast an update to all project members
  async broadcastUpdate(
    projectId: string,
    type: RealtimeUpdate['type'],
    action: RealtimeUpdate['action'],
    payload: any
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const channel = this.projectChannels.get(projectId);
      if (!channel) {
        return { success: false, error: 'Not subscribed to project' };
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const update: RealtimeUpdate = {
        type,
        action,
        payload,
        userId: user.user.id,
        timestamp: new Date().toISOString()
      };

      await channel.send({
        type: 'broadcast',
        event: 'project_update',
        payload: update
      });

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  // Update presence (what document/coding the user is viewing)
  async updatePresence(
    projectId: string,
    currentDocument?: string,
    currentCoding?: string
  ): Promise<void> {
    const channel = this.projectChannels.get(projectId);
    if (channel && this.currentUser) {
      this.currentUser = {
        ...this.currentUser,
        currentDocument,
        currentCoding,
        online_at: new Date().toISOString()
      };
      await channel.track(this.currentUser);
    }
  }

  // Get online users for a project
  getOnlineUsers(projectId: string): PresenceUser[] {
    const channel = this.projectChannels.get(projectId);
    if (!channel) return [];

    const state = channel.presenceState<PresenceUser>();
    return this.parsePresenceState(state);
  }

  // Parse presence state into user array
  private parsePresenceState(state: RealtimePresenceState<PresenceUser>): PresenceUser[] {
    const users: PresenceUser[] = [];
    for (const [_key, presences] of Object.entries(state)) {
      if (presences && presences.length > 0) {
        users.push(presences[0] as PresenceUser);
      }
    }
    return users;
  }

  // Cleanup all subscriptions
  async cleanup(): Promise<void> {
    for (const [projectId] of this.projectChannels) {
      await this.unsubscribeFromProject(projectId);
    }
  }

  // Create a new team project
  async createTeamProject(name: string, description: string): Promise<{ project: SharedProject | null; error: string | null }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { project: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('team_projects')
        .insert({
          name,
          description,
          owner_id: user.user.id,
          owner_email: user.user.email,
          shared_with: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return { project: null, error: error.message };
      }

      return {
        project: {
          id: data.id,
          name: data.name,
          description: data.description,
          ownerId: data.owner_id,
          ownerEmail: data.owner_email,
          sharedWith: data.shared_with || [],
          createdAt: data.created_at,
          updatedAt: data.updated_at
        },
        error: null
      };
    } catch (err) {
      return { project: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  // Share project with team member
  async shareProject(projectId: string, email: string, role: TeamMember['role']): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data: project, error: fetchError } = await supabase
        .from('team_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError || !project) {
        return { success: false, error: 'Project not found' };
      }

      const newMember: TeamMember = {
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
        name: email.split('@')[0],
        role,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };

      const sharedWith = [...(project.shared_with || []), newMember];

      const { error: updateError } = await supabase
        .from('team_projects')
        .update({
          shared_with: sharedWith,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Send invitation email via Supabase edge function (if configured)
      // await this.sendInvitationEmail(email, project.name);

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  // Get all projects shared with user
  async getSharedProjects(): Promise<{ projects: SharedProject[]; error: string | null }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { projects: [], error: 'User not authenticated' };
      }

      // Get projects owned by user
      const { data: ownedProjects, error: ownedError } = await supabase
        .from('team_projects')
        .select('*')
        .eq('owner_id', user.user.id);

      if (ownedError) {
        return { projects: [], error: ownedError.message };
      }

      // Get projects shared with user (check in shared_with array)
      const { data: allProjects, error: allError } = await supabase
        .from('team_projects')
        .select('*');

      if (allError) {
        return { projects: [], error: allError.message };
      }

      const sharedWithMe = (allProjects || []).filter(project => {
        const sharedWith = project.shared_with || [];
        return sharedWith.some((member: TeamMember) => member.email === user.user?.email);
      });

      const allUserProjects = [...(ownedProjects || []), ...sharedWithMe];

      return {
        projects: allUserProjects.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          ownerId: p.owner_id,
          ownerEmail: p.owner_email,
          sharedWith: p.shared_with || [],
          createdAt: p.created_at,
          updatedAt: p.updated_at
        })),
        error: null
      };
    } catch (err) {
      return { projects: [], error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  // Add comment to project
  async addComment(
    projectId: string,
    content: string,
    documentId?: string,
    codingId?: string
  ): Promise<{ comment: CollaborationComment | null; error: string | null }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { comment: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('project_comments')
        .insert({
          project_id: projectId,
          user_id: user.user.id,
          user_email: user.user.email,
          content,
          document_id: documentId,
          coding_id: codingId,
          created_at: new Date().toISOString(),
          resolved: false
        })
        .select()
        .single();

      if (error) {
        return { comment: null, error: error.message };
      }

      return {
        comment: {
          id: data.id,
          projectId: data.project_id,
          userId: data.user_id,
          userEmail: data.user_email,
          content: data.content,
          documentId: data.document_id,
          codingId: data.coding_id,
          createdAt: data.created_at,
          resolved: data.resolved
        },
        error: null
      };
    } catch (err) {
      return { comment: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  // Get comments for project
  async getComments(projectId: string): Promise<{ comments: CollaborationComment[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('project_comments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        return { comments: [], error: error.message };
      }

      return {
        comments: (data || []).map(c => ({
          id: c.id,
          projectId: c.project_id,
          userId: c.user_id,
          userEmail: c.user_email,
          content: c.content,
          documentId: c.document_id,
          codingId: c.coding_id,
          createdAt: c.created_at,
          resolved: c.resolved
        })),
        error: null
      };
    } catch (err) {
      return { comments: [], error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  // Update member role
  async updateMemberRole(projectId: string, memberId: string, newRole: TeamMember['role']): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data: project, error: fetchError } = await supabase
        .from('team_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError || !project) {
        return { success: false, error: 'Project not found' };
      }

      const sharedWith = (project.shared_with || []).map((member: TeamMember) => {
        if (member.id === memberId) {
          return { ...member, role: newRole };
        }
        return member;
      });

      const { error: updateError } = await supabase
        .from('team_projects')
        .update({ shared_with: sharedWith })
        .eq('id', projectId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  // Remove team member from project
  async removeMember(projectId: string, memberId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data: project, error: fetchError } = await supabase
        .from('team_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError || !project) {
        return { success: false, error: 'Project not found' };
      }

      const sharedWith = (project.shared_with || []).filter(
        (member: TeamMember) => member.id !== memberId
      );

      const { error: updateError } = await supabase
        .from('team_projects')
        .update({ shared_with: sharedWith })
        .eq('id', projectId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  // ==========================================
  // INVITATION MANAGEMENT
  // ==========================================

  // Create and store invitation
  async createInvitation(
    projectId: string,
    email: string,
    role: 'editor' | 'viewer',
    projectName: string
  ): Promise<{ invitation: TeamInvitation | null; token: string | null; error: string | null }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { invitation: null, token: null, error: 'User not authenticated' };
      }

      // Create invitation data
      const inviteData = {
        email: email.toLowerCase(),
        role,
        projectId,
        projectName,
        invitedAt: new Date().toISOString(),
        inviterName: user.user.email?.split('@')[0] || 'EVIDENRA User',
        inviterEmail: user.user.email || '',
        discount: 20
      };

      // Generate token (base64 encoded)
      const token = btoa(JSON.stringify(inviteData));

      const invitation: TeamInvitation = {
        id: crypto.randomUUID(),
        projectId,
        email: email.toLowerCase(),
        role,
        inviterName: inviteData.inviterName,
        inviterEmail: inviteData.inviterEmail,
        token,
        status: 'pending',
        discount: 20,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      // Store invitation in Supabase
      const { error } = await supabase
        .from('team_invitations')
        .insert({
          id: invitation.id,
          project_id: invitation.projectId,
          email: invitation.email,
          role: invitation.role,
          inviter_name: invitation.inviterName,
          inviter_email: invitation.inviterEmail,
          token: invitation.token,
          status: invitation.status,
          discount: invitation.discount,
          created_at: invitation.createdAt,
          expires_at: invitation.expiresAt
        });

      if (error) {
        // If table doesn't exist, just return the invitation without storing
        console.warn('Could not store invitation in database:', error.message);
      }

      return { invitation, token, error: null };
    } catch (err) {
      return { invitation: null, token: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  // Accept invitation and join project
  async acceptInvitation(token: string): Promise<{ success: boolean; projectId: string | null; error: string | null }> {
    try {
      // Decode token
      const inviteData = JSON.parse(atob(token));

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, projectId: null, error: 'User not authenticated' };
      }

      // Verify email matches (optional - can be disabled for flexibility)
      // if (user.user.email?.toLowerCase() !== inviteData.email.toLowerCase()) {
      //   return { success: false, projectId: null, error: 'Email does not match invitation' };
      // }

      // Add user to project
      const { success, error } = await this.shareProject(
        inviteData.projectId,
        user.user.email || inviteData.email,
        inviteData.role === 'coder' ? 'editor' : inviteData.role
      );

      if (!success) {
        return { success: false, projectId: null, error };
      }

      // Update invitation status in database
      await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('token', token);

      return { success: true, projectId: inviteData.projectId, error: null };
    } catch (err) {
      return { success: false, projectId: null, error: err instanceof Error ? err.message : 'Invalid invitation token' };
    }
  }

  // Get pending invitations for current user
  async getPendingInvitations(): Promise<{ invitations: TeamInvitation[]; error: string | null }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { invitations: [], error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('email', user.user.email?.toLowerCase())
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (error) {
        return { invitations: [], error: error.message };
      }

      return {
        invitations: (data || []).map(inv => ({
          id: inv.id,
          projectId: inv.project_id,
          email: inv.email,
          role: inv.role,
          inviterName: inv.inviter_name,
          inviterEmail: inv.inviter_email,
          token: inv.token,
          status: inv.status,
          discount: inv.discount,
          createdAt: inv.created_at,
          expiresAt: inv.expires_at
        })),
        error: null
      };
    } catch (err) {
      return { invitations: [], error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  // Decline invitation
  async declineInvitation(invitationId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  // ==========================================
  // SYNC CODING UPDATES
  // ==========================================

  // Broadcast coding change to team
  async syncCodingUpdate(
    projectId: string,
    codingId: string,
    action: 'create' | 'update' | 'delete',
    codingData: any
  ): Promise<void> {
    await this.broadcastUpdate(projectId, 'coding', action as any, {
      codingId,
      ...codingData
    });
  }

  // Broadcast document change to team
  async syncDocumentUpdate(
    projectId: string,
    documentId: string,
    action: 'create' | 'update' | 'delete',
    documentData: any
  ): Promise<void> {
    await this.broadcastUpdate(projectId, 'document', action as any, {
      documentId,
      ...documentData
    });
  }
}

export const teamCollaborationService = new TeamCollaborationService();
