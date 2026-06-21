import React from 'react';

type IconProps = {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  title?: string;
};

export const Icon: React.FC<IconProps> = ({ name, size = 20, color = 'currentColor', className, title }) => (
  <span
    className={`material-symbols-rounded ${className ?? ''}`.trim()}
    aria-hidden={title ? undefined : true}
    title={title}
    style={{ fontSize: size, color, lineHeight: 1 }}
  >
    {name}
  </span>
);

export const Card: React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLElement> & { className?: string }>> = ({
  children,
  className,
  style,
  ...rest
}) => (
  <section className={`gc-card ${className ?? ''}`.trim()} style={style} {...rest}>
    {children}
  </section>
);

export const SectionTitle: React.FC<React.PropsWithChildren<{ title: string; subtitle?: string; icon?: string; action?: React.ReactNode }>> = ({
  title,
  subtitle,
  icon,
  action,
}) => (
  <div className="gc-section-title">
    <div className="gc-section-title__left">
      {icon ? <div className="gc-icon-badge"><Icon name={icon} size={18} color="#ccf5ec" /></div> : null}
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </div>
    {action ? <div>{action}</div> : null}
  </div>
);

export const Badge: React.FC<React.PropsWithChildren<{ tone?: 'green' | 'blue' | 'amber' | 'red' | 'slate' | 'white'; className?: string }>> = ({
  children,
  tone = 'slate',
  className,
}) => <span className={`gc-badge gc-badge--${tone} ${className ?? ''}`.trim()}>{children}</span>;

export const Button: React.FC<
  React.PropsWithChildren<{
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    type?: 'button' | 'submit';
    className?: string;
    disabled?: boolean;
  }>
> = ({ children, onClick, variant = 'primary', type = 'button', className, disabled }) => (
  <button
    type={type}
    className={`gc-button gc-button--${variant} ${className ?? ''}`.trim()}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

export const MetricChip: React.FC<{ label: string; value: string; tone?: 'green' | 'blue' | 'amber' | 'red' | 'slate' }> = ({
  label,
  value,
  tone = 'slate',
}) => (
  <div className={`gc-metric-chip gc-metric-chip--${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export const EmptyState: React.FC<React.PropsWithChildren<{ title: string; subtitle: string; icon?: string }>> = ({
  title,
  subtitle,
  icon = 'search',
}) => (
  <div className="gc-empty-state">
    <div className="gc-empty-state__icon">
      <Icon name={icon} size={30} color="#a8d7a5" />
    </div>
    <h3>{title}</h3>
    <p>{subtitle}</p>
  </div>
);
