import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge, BadgeButton, BadgeDot } from '@/components/ui/badge';

describe('Badge Component', () => {
  // Basic rendering test
  test('renders badge with text', () => {
    render(<Badge>Test Badge</Badge>);
    const badge = screen.getByText('Test Badge');
    expect(badge).toBeInTheDocument();
  });

  // Props testing for different variants
  test('renders with different variants', () => {
    const { rerender } = render(<Badge variant="primary">Primary Badge</Badge>);
    expect(screen.getByText('Primary Badge')).toBeInTheDocument();

    rerender(<Badge variant="secondary">Secondary Badge</Badge>);
    expect(screen.getByText('Secondary Badge')).toBeInTheDocument();

    rerender(<Badge variant="destructive">Destructive Badge</Badge>);
    expect(screen.getByText('Destructive Badge')).toBeInTheDocument();

    rerender(<Badge variant="outline">Outline Badge</Badge>);
    expect(screen.getByText('Outline Badge')).toBeInTheDocument();
  });

  // Size variants testing
  test('renders with different sizes', () => {
    const { rerender } = render(<Badge size="sm">Small Badge</Badge>);
    expect(screen.getByText('Small Badge')).toBeInTheDocument();

    rerender(<Badge size="md">Medium Badge</Badge>);
    expect(screen.getByText('Medium Badge')).toBeInTheDocument();

    rerender(<Badge size="lg">Large Badge</Badge>);
    expect(screen.getByText('Large Badge')).toBeInTheDocument();

    rerender(<Badge size="xs">Extra Small Badge</Badge>);
    expect(screen.getByText('Extra Small Badge')).toBeInTheDocument();
  });

  // Appearance variants testing
  test('renders with different appearances', () => {
    const { rerender } = render(<Badge appearance="default">Default Badge</Badge>);
    expect(screen.getByText('Default Badge')).toBeInTheDocument();

    rerender(<Badge appearance="light">Light Badge</Badge>);
    expect(screen.getByText('Light Badge')).toBeInTheDocument();

    rerender(<Badge appearance="outline">Outline Badge</Badge>);
    expect(screen.getByText('Outline Badge')).toBeInTheDocument();

    rerender(<Badge appearance="ghost">Ghost Badge</Badge>);
    expect(screen.getByText('Ghost Badge')).toBeInTheDocument();
  });

  // Shape variants testing
  test('renders with different shapes', () => {
    const { rerender } = render(<Badge shape="default">Default Shape Badge</Badge>);
    expect(screen.getByText('Default Shape Badge')).toBeInTheDocument();

    rerender(<Badge shape="circle">Circle Badge</Badge>);
    expect(screen.getByText('Circle Badge')).toBeInTheDocument();
  });

  // Disabled state testing
  test('renders disabled badge', () => {
    render(<Badge disabled>Disabled Badge</Badge>);
    const badge = screen.getByText('Disabled Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('opacity-50', 'pointer-events-none');
  });

  // Custom className testing
  test('applies custom className', () => {
    render(<Badge className="custom-class">Badge with Custom Class</Badge>);
    const badge = screen.getByText('Badge with Custom Class');
    expect(badge).toHaveClass('custom-class');
  });

  // Children content testing
  test('renders children correctly', () => {
    render(
      <Badge>
        <span>Complex Children</span>
        <strong>Bold Text</strong>
      </Badge>
    );
    expect(screen.getByText('Complex Children')).toBeInTheDocument();
    expect(screen.getByText('Bold Text')).toBeInTheDocument();
  });

  // Test with asChild prop
  test('renders as child component when asChild is true', () => {
    render(
      <Badge asChild>
        <button>Button Badge</button>
      </Badge>
    );
    const button = screen.getByRole('button', { name: /button badge/i });
    expect(button).toBeInTheDocument();
  });

  // Test BadgeButton component
  test('renders BadgeButton correctly', () => {
    render(<BadgeButton>Badge Button</BadgeButton>);
    const badgeButton = screen.getByRole('button', { name: /badge button/i });
    expect(badgeButton).toBeInTheDocument();
  });

  // Test BadgeDot component
  test('renders BadgeDot correctly', () => {
    render(<BadgeDot data-testid="badge-dot" />);
    const badgeDot = screen.getByTestId('badge-dot');
    expect(badgeDot).toBeInTheDocument();
    expect(badgeDot).toHaveClass('size-1.5', 'rounded-full');
  });

  // Test complex props combination
  test('handles complex props combination', () => {
    render(
      <Badge
        variant="success"
        size="lg"
        appearance="light"
        shape="circle"
        className="custom-class"
        data-testid="complex-badge"
      >
        Complex Badge
      </Badge>
    );

    const badge = screen.getByTestId('complex-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('custom-class');
    expect(screen.getByText('Complex Badge')).toBeInTheDocument();
  });

  // Test default props
  test('uses default props correctly', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');

    // Should have default variant (primary), appearance (default), size (md), shape (default)
    expect(badge).toBeInTheDocument();
    expect(badge).not.toHaveClass('opacity-50'); // Not disabled by default
  });

  // Test with empty children
  test('handles empty children gracefully', () => {
    render(<Badge data-testid="empty-badge"></Badge>);
    const badge = screen.getByTestId('empty-badge');
    expect(badge).toBeInTheDocument();
  });

  // Test with null/undefined children
  test('handles null children gracefully', () => {
    render(<Badge data-testid="null-badge">{null}</Badge>);
    const badge = screen.getByTestId('null-badge');
    expect(badge).toBeInTheDocument();
  });

  // Test all color variants
  test('renders all color variants correctly', () => {
    const variants = ['primary', 'secondary', 'success', 'warning', 'info', 'destructive'];

    variants.forEach(variant => {
      const { unmount } = render(<Badge variant={variant}>{variant} Badge</Badge>);
      expect(screen.getByText(`${variant} Badge`)).toBeInTheDocument();
      unmount();
    });
  });

  // Test BadgeButton with asChild
  test('BadgeButton renders as child component when asChild is true', () => {
    render(
      <BadgeButton asChild>
        <a href="/test">Link Badge Button</a>
      </BadgeButton>
    );
    const link = screen.getByRole('link', { name: /link badge button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  // Test BadgeDot with custom className
  test('BadgeDot applies custom className', () => {
    render(<BadgeDot className="custom-dot-class" data-testid="badge-dot" />);
    const badgeDot = screen.getByTestId('badge-dot');
    expect(badgeDot).toHaveClass('custom-dot-class');
  });

  // Test data-slot attribute
  test('Badge has correct data-slot attribute', () => {
    render(<Badge data-testid="badge">Test Badge</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-slot', 'badge');
  });

  // Test BadgeButton data-slot attribute
  test('BadgeButton has correct data-slot attribute', () => {
    render(<BadgeButton data-testid="badge-button">Test Badge Button</BadgeButton>);
    const badgeButton = screen.getByTestId('badge-button');
    expect(badgeButton).toHaveAttribute('data-slot', 'badge-button');
  });

  // Test BadgeDot data-slot attribute
  test('BadgeDot has correct data-slot attribute', () => {
    render(<BadgeDot data-testid="badge-dot" />);
    const badgeDot = screen.getByTestId('badge-dot');
    expect(badgeDot).toHaveAttribute('data-slot', 'badge-dot');
  });
});