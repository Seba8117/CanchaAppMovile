import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import logoIcon from 'figma:asset/66394a385685f7f512fa4478af752d1d9db6eb4e.png';

interface AppHeaderProps {
  title: string;
  showLogo?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  titleClassName?: string;
}

export function AppHeader({ 
  title, 
  showLogo = false, 
  showBackButton = false, 
  onBack, 
  rightContent,
  titleClassName = "text-[#172c44] text-lg"
}: AppHeaderProps) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-100">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {showBackButton && onBack && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onBack}
              className="h-8 w-8 text-[#172c44] hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </Button>
          )}
          {showLogo && (
            <img 
              src={logoIcon} 
              alt="CanchApp" 
              className="w-8 h-8 rounded-lg"
            />
          )}
          <h1 className={titleClassName}>{title}</h1>
        </div>
        {rightContent}
      </div>
    </div>
  );
}