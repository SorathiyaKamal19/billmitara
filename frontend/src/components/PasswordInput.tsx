import { InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  showLabel?: string;
  hideLabel?: string;
  showLockIcon?: boolean;
}

export function PasswordInput({
  className = '',
  showLabel = 'Show password',
  hideLabel = 'Hide password',
  showLockIcon = false,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      {showLockIcon && (
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      )}
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`input pr-11 ${showLockIcon ? 'pl-10' : ''} ${className}`}
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-white/10 dark:hover:text-white"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? hideLabel : showLabel}
        title={visible ? hideLabel : showLabel}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
