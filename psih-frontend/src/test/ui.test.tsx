import { render, screen } from '@testing-library/react';
import { Input, StatusBadge } from '../components/ui';

it('StatusBadge shows readable text, not colour only', () => {
  render(<StatusBadge status="PENDING" />);
  expect(screen.getByText('Pending')).toBeInTheDocument();
});
it('Input links its error message for screen readers', () => {
  render(<Input id="e" label="Email" error="Enter a valid email address." />);
  const input = screen.getByLabelText('Email');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAccessibleDescription('Enter a valid email address.');
});
