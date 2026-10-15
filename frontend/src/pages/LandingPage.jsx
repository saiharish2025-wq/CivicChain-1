
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  ArrowRight,
  Zap
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();

  // If a user is already signed in, take them to their role-specific dashboard.
  if (user) {
    if (user.role === 'CITIZEN') {
      return <Navigate to="/citizen-dashboard" replace />;
    }

    if (user.role === 'ADMIN') {
      return <Navigate to="/admin-dashboard" replace />;
    }

    if (['AUTHORITY', 'INVESTIGATOR', 'VERIFIER'].includes(user.role)) {
      return <Navigate to="/authority-dashboard" replace />;
    }
  }

  const features = [
    {
      icon: '🔒',
      title: 'Privacy Preserving',
      desc: 'Citizen data stays private. Only authorized personnel access sensitive information.',
      color: '#3b82f6'
    },
    {
      icon: '⛓',
      title: 'Blockchain Audit Trail',
      desc: 'Every lifecycle event is recorded immutably. Complete tamper-evident history.',
      color: '#06b6d4'
    },
    {
      icon: '📸',
      title: 'Evidence Integrity',
      desc: 'SHA-256 hashes help detect changes to uploaded evidence.',
      color: '#10b981'
    },
    {
      icon: '🔄',
      title: '9-Stage Lifecycle',
      desc: 'Report → Register → Assign → Investigate → Verify → Act → Resolve → Verify → Close',
      color: '#f59e0b'
    },
    {
      icon: '👥',
      title: 'Role-Based Access',
      desc: 'Distinct permissions for citizens, authorities, investigators, verifiers, and admins.',
      color: '#a855f7'
    },
    {
      icon: '📊',
      title: 'Dashboards',
      desc: 'View complaint progress and relevant information for your role.',
      color: '#ef4444'
    }
  ];

  const lifecycle = [
    'REPORT',
    'REGISTER',
    'ASSIGN',
    'INVESTIGATE',
    'VERIFY',
    'TAKE ACTION',
    'RESOLVE',
    'VERIFY RESOLUTION',
    'CLOSE'
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav className="landing-navbar">
        <div className="landing-brand">⛓ CivicChain</div>

        <div className="landing-nav-actions">
          <Link to="/login" className="btn btn-secondary btn-sm">
            Sign In
          </Link>
          <Link to="/register" className="btn btn-primary btn-sm">
            Get Started
          </Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-badge">
          <Zap size={14} /> Powered by Hyperledger Fabric
        </div>

        <h1 className="hero-title">
          Civic Accountability
          <br />
          on the Blockchain
        </h1>

        <p className="hero-subtitle">
          CivicChain is a privacy-preserving platform that empowers citizens
          to report public infrastructure issues and holds authorities
          accountable through tamper-evident blockchain records.
        </p>

        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary btn-lg">
            <Shield size={18} /> Report an Issue
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            <ArrowRight size={18} /> Sign In
          </Link>
        </div>

        <div className="features-grid">
          {features.map((feature) => (
            <div className="feature-card" key={feature.title}>
              <div
                className="feature-icon"
                style={{
                  background: `${feature.color}20`,
                  border: `1px solid ${feature.color}30`
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{feature.icon}</span>
              </div>
              <div className="feature-title">{feature.title}</div>
              <div className="feature-desc">{feature.desc}</div>
            </div>
          ))}
        </div>
        <section
          style={{
            padding: 'clamp(32px, 6vw, 80px) 0',
            maxWidth: 900,
            margin: '0 auto'
          }}
        >
          <h2
            style={{
              textAlign: 'center',
              fontSize: '1.8rem',
              fontWeight: 800,
              marginBottom: 8
            }}
          >
            Complaint Lifecycle
          </h2>

          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              marginBottom: 40
            }}
          >
            9-stage state machine enforced on the blockchain
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              justifyContent: 'center'
            }}
          >
            {lifecycle.map((stage, index) => (
              <div
                key={stage}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <div
                  style={{
                    background: `hsl(${220 + index * 15}, 70%, 40%)`,
                    border: `1px solid hsl(${220 + index * 15}, 70%, 50%)`,
                    borderRadius: 100,
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'white',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {stage}
                </div>
                {index < lifecycle.length - 1 && (
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                )}
              </div>
            ))}
          </div>
        </section>
      </section>

      <footer className="landing-footer">
        CivicChain — Privacy-Preserving Civic Accountability Platform
        &nbsp;|&nbsp; Built with Hyperledger Fabric
      </footer>
    </div>
  );
}
