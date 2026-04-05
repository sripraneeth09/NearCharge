export default function StatusBadge({ status }) {
  const cls =
    status === 'pending'  ? 'status-badge status-pending'  :
    status === 'approved' ? 'status-badge status-approved' :
    status === 'rejected' ? 'status-badge status-rejected' :
    'status-badge';

  return <span className={cls}>{status?.toUpperCase()}</span>;
}
