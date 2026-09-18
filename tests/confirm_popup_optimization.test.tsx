import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmPopup } from '../components/ConfirmPopup';
import React from 'react';

// @vitest-environment jsdom

describe('ConfirmPopup Optimization & Correctness', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ConfirmPopup
        isOpen={false}
        message="Test Message"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders title, message, and buttons correctly when isOpen is true', () => {
    render(
      <ConfirmPopup
        isOpen={true}
        title="Delete Item?"
        message="This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="No, Keep"
        type="danger"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Delete Item?')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
    expect(screen.getByText('No, Keep')).toBeInTheDocument();
  });

  it('triggers onConfirm and onCancel callbacks on button clicks', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <ConfirmPopup
        isOpen={true}
        message="Confirm Action?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );

    fireEvent.click(screen.getByTestId('confirm-popup-cancel-btn'));
    expect(handleCancel).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('confirm-popup-confirm-btn'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('stops event propagation on overlay and container clicks', () => {
    const parentClick = vi.fn();

    render(
      <div onClick={parentClick}>
        <ConfirmPopup
          isOpen={true}
          message="Inside Container"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      </div>
    );

    const overlay = screen.getByTestId('confirm-popup-overlay');
    fireEvent.click(overlay);
    expect(parentClick).not.toHaveBeenCalled();

    const container = screen.getByTestId('confirm-popup-container');
    fireEvent.click(container);
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('benchmarks ConfirmPopup rendering performance over 1,000 renders', () => {
    const onConfirm = () => {};
    const onCancel = () => {};

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const { unmount } = render(
        <ConfirmPopup
          isOpen={i % 2 === 0}
          title={`Modal ${i}`}
          message="Benchmark test message"
          type={i % 3 === 0 ? 'danger' : i % 3 === 1 ? 'warning' : 'info'}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );
      unmount();
    }
    const duration = performance.now() - start;

    console.log(`CONFIRM POPUP BENCHMARK: 1,000 renders completed in ${duration.toFixed(3)}ms`);
    expect(duration).toBeGreaterThan(0);
  });
});
