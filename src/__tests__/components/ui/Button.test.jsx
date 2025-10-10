import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  // Basic rendering test
  test('renders button with text', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  // Props testing for different variants
  test('renders with different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary Button</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button variant="destructive">Destructive Button</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button variant="outline">Outline Button</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  // Size variants testing
  test('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small Button</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button size="md">Medium Button</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button size="lg">Large Button</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  // Disabled state testing
  test('renders disabled button', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-60');
  });

  // Click interaction testing
  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Clickable Button</Button>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Test that onClick is NOT called when disabled
  test('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} disabled>
        Disabled Button
      </Button>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  // Custom className testing
  test('applies custom className', () => {
    render(<Button className="custom-class">Button with Custom Class</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  // Additional comprehensive tests for edge cases

  // Test with asChild prop
  test('renders as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  // Test selected state
  test('applies selected state correctly', () => {
    render(<Button selected>Selected Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-state', 'open');
  });

  // Test icon size variant
  test('renders with icon size', () => {
    render(<Button size="icon">Icon Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('size-8.5');
  });

  // Test placeholder prop
  test('applies placeholder styling when placeholder is true', () => {
    render(<Button placeholder>Placeholder Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-muted-foreground');
  });

  // Test different modes
  test('renders with different modes', () => {
    const { rerender } = render(<Button mode="default">Default Mode</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button mode="icon">Icon Mode</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button mode="link">Link Mode</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  // Test keyboard interaction
  test('handles keyboard events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Keyboard Button</Button>);

    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    fireEvent.keyDown(button, { key: ' ', code: 'Space' });

    // Note: Button component may not handle Enter/Space by default
    // This test ensures the component doesn't throw errors on keyboard events
    expect(button).toBeInTheDocument();
  });

  // Test focus states
  test('handles focus states correctly', () => {
    render(<Button>Focusable Button</Button>);
    const button = screen.getByRole('button');

    button.focus();
    expect(button).toHaveFocus();

    button.blur();
    expect(button).not.toHaveFocus();
  });

  // Test with complex props combination
  test('handles complex props combination', () => {
    const handleClick = jest.fn();
    render(
      <Button
        variant="outline"
        size="lg"
        onClick={handleClick}
        className="custom-class"
        data-testid="complex-button"
      >
        Complex Button
      </Button>
    );

    const button = screen.getByTestId('complex-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('custom-class');

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Test default props
  test('uses default props correctly', () => {
    render(<Button>Default Button</Button>);
    const button = screen.getByRole('button');

    // Should have default variant (primary), size (md), etc.
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  // Test with empty children
  test('handles empty children gracefully', () => {
    render(<Button></Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  // Test with null/undefined children
  test('handles null children gracefully', () => {
    render(<Button>{null}</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});