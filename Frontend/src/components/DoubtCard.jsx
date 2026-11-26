import { useNavigate } from 'react-router-dom';
import { Card, Badge, StatusBadge, CoinBadge, Avatar } from './UI';

const DEPT_COLORS = { CSE:'#4F8EF7', EEE:'#F5B93E', ME:'#2DDBA6', CE:'#F75F5F', BBA:'#A78BFA', MATH:'#FB923C', PHYSICS:'#38BDF8', CHEM:'#34D399', ENG:'#F472B6', OTHER:'#94A3B8' };

export default function DoubtCard({ doubt }) {
  const navigate = useNavigate();
  const col = DEPT_COLORS[doubt.department] || 'var(--accent)';
  return (
    <Card onClick={() => navigate(`/doubts/${doubt._id}`)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doubt.title}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            <Badge label={doubt.department} color={col} />
            {(doubt.tags || []).slice(0, 3).map(t => <Badge key={t} label={t} color="var(--text-muted)" />)}
            {doubt.isReported && <Badge label="⚠️ Reported" color="var(--red)" />}
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            {doubt.postedBy && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar name={doubt.postedBy.name} size={20} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{doubt.postedBy.name}</span>
              </div>
            )}
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{new Date(doubt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>👤 {(doubt.applicants || []).length} applied</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>👁 {doubt.views || 0}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
          <CoinBadge amount={doubt.coinReward} />
          <StatusBadge status={doubt.status} />
        </div>
      </div>
    </Card>
  );
}
