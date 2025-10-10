import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Avatar, AvatarFallback, AvatarImage, AvatarIndicator, AvatarStatus } from '@/components/ui/avatar';

describe('Avatar Component', () => {
  // Basic rendering test - renders avatar with fallback
  test('renders avatar with fallback text', () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );

    const fallback = screen.getByText('JD');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveClass('flex', 'h-full', 'w-full', 'items-center', 'justify-center', 'rounded-full');
  });

  // Image avatar testing - renders avatar with image
  test('renders avatar with image', () => {
    const { container } = render(
      <Avatar>
        <AvatarImage src="https://example.com/avatar.jpg" alt="User avatar" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );

    // Debug: Log the rendered HTML to understand the structure
    console.log('Rendered HTML:', container.innerHTML);

    const image = screen.getByRole('img', { hidden: true });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(image).toHaveAttribute('alt', 'User avatar');
  });

  // Fallback when image fails to load testing
  test('shows fallback when image fails to load', async () => {
    render(
      <Avatar>
        <AvatarImage src="https://example.com/invalid-avatar.jpg" alt="User avatar" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );

    const image = screen.getByRole('img', { hidden: true });

    // Simulate image load error
    fireEvent.error(image);

    // Wait for fallback to be visible
    await waitFor(() => {
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  // Custom className testing
  test('applies custom className to avatar', () => {
    render(
      <Avatar className="custom-avatar-class">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );

    const avatar = screen.getByText('JD').closest('[data-slot="avatar"]');
    expect(avatar).toHaveClass('custom-avatar-class');
  });

  // Test AvatarImage with custom className
  test('applies custom className to avatar image', () => {
    render(
      <Avatar>
        <AvatarImage src="https://example.com/avatar.jpg" alt="User avatar" className="custom-image-class" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );

    const image = screen.getByRole('img', { hidden: true });
    expect(image).toHaveClass('custom-image-class');
  });

  // Test AvatarFallback with custom className
  test('applies custom className to avatar fallback', () => {
    render(
      <Avatar>
        <AvatarFallback className="custom-fallback-class">JD</AvatarFallback>
      </Avatar>
    );

    const fallback = screen.getByText('JD');
    expect(fallback).toHaveClass('custom-fallback-class');
  });

  // Test AvatarIndicator component
  test('renders avatar indicator', () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
        <AvatarIndicator data-testid="avatar-indicator">
          <div data-testid="indicator-content">●</div>
        </AvatarIndicator>
      </Avatar>
    );

    const indicator = screen.getByTestId('avatar-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('absolute', 'flex', 'size-6', 'items-center', 'justify-center');
  });

  // Test AvatarStatus component
  test('renders avatar status with different variants', () => {
    const { rerender } = render(
      <AvatarStatus variant="online" data-testid="avatar-status" />
    );

    let status = screen.getByTestId('avatar-status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveClass('bg-green-600');

    rerender(<AvatarStatus variant="offline" data-testid="avatar-status" />);
    status = screen.getByTestId('avatar-status');
    expect(status).toHaveClass('bg-zinc-400', 'dark:bg-zinc-500');

    rerender(<AvatarStatus variant="busy" data-testid="avatar-status" />);
    status = screen.getByTestId('avatar-status');
    expect(status).toHaveClass('bg-yellow-600');

    rerender(<AvatarStatus variant="away" data-testid="avatar-status" />);
    status = screen.getByTestId('avatar-status');
    expect(status).toHaveClass('bg-blue-600');
  });

  // Test AvatarStatus with custom className
  test('applies custom className to avatar status', () => {
    render(
      <AvatarStatus variant="online" className="custom-status-class" data-testid="avatar-status" />
    );

    const status = screen.getByTestId('avatar-status');
    expect(status).toHaveClass('custom-status-class');
  });

  // Test complete avatar with all components
  test('renders complete avatar with image, fallback, indicator, and status', () => {
    render(
      <Avatar className="main-avatar">
        <AvatarImage src="https://example.com/avatar.jpg" alt="User avatar" />
        <AvatarFallback>JD</AvatarFallback>
        <AvatarIndicator>
          <AvatarStatus variant="online" />
        </AvatarIndicator>
      </Avatar>
    );

    // Check main avatar
    const avatar = screen.getByText('JD').closest('[data-slot="avatar"]');
    expect(avatar).toHaveClass('main-avatar');

    // Check image exists
    const image = screen.getByRole('img', { hidden: true });
    expect(image).toBeInTheDocument();

    // Check status indicator
    const status = screen.getByText('JD').closest('[data-slot="avatar"]').querySelector('[data-slot="avatar-status"]');
    expect(status).toBeInTheDocument();
    expect(status).toHaveClass('bg-green-600');
  });

  // Test avatar without image (fallback only)
  test('renders avatar with fallback only', () => {
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );

    const fallback = screen.getByText('AB');
    expect(fallback).toBeInTheDocument();

    // Image should not be present
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
  });

  // Test avatar size and styling
  test('applies correct default styling to avatar', () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );

    const avatar = screen.getByText('JD').closest('[data-slot="avatar"]');
    expect(avatar).toHaveClass('relative', 'flex', 'shrink-0', 'size-10');
  });

  // Test avatar with different fallback content
  test('renders avatar with different fallback content types', () => {
    const { rerender } = render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );

    expect(screen.getByText('JD')).toBeInTheDocument();

    rerender(
      <Avatar>
        <AvatarFallback>
          <span>Custom Content</span>
        </AvatarFallback>
      </Avatar>
    );

    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  // Test avatar data attributes
  test('applies correct data attributes', () => {
    render(
      <Avatar>
        <AvatarImage src="https://example.com/avatar.jpg" alt="User avatar" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );

    const avatar = screen.getByText('JD').closest('[data-slot="avatar"]');
    expect(avatar).toHaveAttribute('data-slot', 'avatar');

    const image = screen.getByRole('img', { hidden: true });
    expect(image).toHaveAttribute('data-slot', 'avatar-image');

    const fallback = screen.getByText('JD');
    expect(fallback).toHaveAttribute('data-slot', 'avatar-fallback');
  });

  // Test avatar with props spreading
  test('spreads additional props correctly', () => {
    render(
      <Avatar data-testid="custom-avatar" role="button" tabIndex={0}>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );

    const avatar = screen.getByTestId('custom-avatar');
    expect(avatar).toHaveAttribute('role', 'button');
    expect(avatar).toHaveAttribute('tabIndex', '0');
  });

  // Test avatar image error handling
  test('handles image load error correctly', async () => {
    const mockOnError = jest.fn();

    render(
      <Avatar>
        <AvatarImage
          src="https://example.com/broken-image.jpg"
          alt="Broken avatar"
          onError={mockOnError}
        />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );

    const image = screen.getByRole('img', { hidden: true });

    // Simulate image load error
    fireEvent.error(image);

    expect(mockOnError).toHaveBeenCalledTimes(1);

    // Fallback should still be visible
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  // Test avatar with empty fallback
  test('handles empty fallback gracefully', () => {
    render(
      <Avatar>
        <AvatarFallback></AvatarFallback>
      </Avatar>
    );

    const fallback = document.querySelector('[data-slot="avatar-fallback"]');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toBeEmptyDOMElement();
  });

  // Test avatar with multiple indicators
  test('renders avatar with multiple indicators', () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
        <AvatarIndicator data-testid="indicator-1">
          <div>●</div>
        </AvatarIndicator>
        <AvatarIndicator data-testid="indicator-2">
          <div>■</div>
        </AvatarIndicator>
      </Avatar>
    );

    expect(screen.getByTestId('indicator-1')).toBeInTheDocument();
    expect(screen.getByTestId('indicator-2')).toBeInTheDocument();
  });

  // Test avatar status default variant
  test('uses default online variant for avatar status', () => {
    render(
      <AvatarStatus data-testid="avatar-status" />
    );

    const status = screen.getByTestId('avatar-status');
    expect(status).toHaveClass('bg-green-600');
  });

  // Test avatar with complex nested structure
  test('handles complex nested avatar structure', () => {
    render(
      <Avatar className="parent-avatar">
        <AvatarImage src="https://example.com/avatar.jpg" alt="User avatar" />
        <AvatarFallback className="fallback">
          <span className="initials">JD</span>
        </AvatarFallback>
        <AvatarIndicator className="indicator">
          <AvatarStatus variant="busy" className="status" />
        </AvatarIndicator>
      </Avatar>
    );

    // Check all elements are present
    const avatar = screen.getByText('JD').closest('[data-slot="avatar"]');
    expect(avatar).toHaveClass('parent-avatar');

    const fallback = screen.getByText('JD').closest('[data-slot="avatar-fallback"]');
    expect(fallback).toHaveClass('fallback');

    const status = avatar.querySelector('[data-slot="avatar-status"]');
    expect(status).toHaveClass('status', 'bg-yellow-600');
  });
});