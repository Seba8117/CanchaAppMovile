import React from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

interface NotificationHelperProps {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  onClose?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

export function NotificationHelper({ type, title, message, onClose, actions }: NotificationHelperProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'warning':
        return 'text-yellow-800';
      case 'error':
        return 'text-red-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  };

  const getMessageColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-700';
      case 'warning':
        return 'text-yellow-700';
      case 'error':
        return 'text-red-700';
      case 'info':
      default:
        return 'text-blue-700';
    }
  };

  return (
    <div className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-lg border ${getBackgroundColor()}`}>
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium ${getTitleColor()}`}>{title}</h3>
          <p className={`text-sm mt-1 ${getMessageColor()}`}>{message}</p>
          
          {actions && actions.length > 0 && (
            <div className="flex space-x-2 mt-3">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    action.variant === 'primary'
                      ? 'bg-[#f4b400] text-[#172c44] hover:bg-[#e6a200]'
                      : 'bg-white text-[#172c44] border border-[rgba(23,44,68,0.1)] hover:bg-[#f8f9fa]'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Toast notification service simulation
export const notificationService = {
  show: (notification: Omit<NotificationHelperProps, 'onClose'>) => {
    // In a real app, this would integrate with a toast library like react-hot-toast or sonner
    console.log('Notification:', notification);
  },
  
  showTeamDeletionInitiated: (teamName: string) => {
    notificationService.show({
      type: 'warning',
      title: 'Votación Iniciada',
      message: `Se ha iniciado la votación para eliminar "${teamName}". Los miembros han sido notificados por email y en la app.`,
    });
  },
  
  showEmailSent: (teamName: string, memberCount: number) => {
    notificationService.show({
      type: 'info',
      title: 'Emails Enviados',
      message: `Se enviaron ${memberCount} notificaciones por email a los miembros de "${teamName}".`,
    });
  },
  
  showVotingReminder: (teamName: string, hoursLeft: number) => {
    notificationService.show({
      type: 'warning',
      title: 'Recordatorio de Votación',
      message: `Quedan ${hoursLeft} horas para votar sobre la eliminación de "${teamName}".`,
    });
  }
};