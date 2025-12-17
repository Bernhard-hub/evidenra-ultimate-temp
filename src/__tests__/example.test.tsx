import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Simple component for testing
function TestComponent({ message }: { message: string }) {
  return <div data-testid="test-message">{message}</div>;
}

describe('Example React Component Tests', () => {
  it('should render component with message', () => {
    const testMessage = 'Hello, Vitest!';
    render(<TestComponent message={testMessage} />);

    const element = screen.getByTestId('test-message');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent(testMessage);
  });

  it('should update when message prop changes', () => {
    const { rerender } = render(<TestComponent message="Initial" />);

    let element = screen.getByTestId('test-message');
    expect(element).toHaveTextContent('Initial');

    rerender(<TestComponent message="Updated" />);
    element = screen.getByTestId('test-message');
    expect(element).toHaveTextContent('Updated');
  });
});
