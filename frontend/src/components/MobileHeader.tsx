interface MobileHeaderProps {
  title: string;
  onMenuToggle: () => void;
}

export function MobileHeader({ title }: MobileHeaderProps) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-16 px-5 flex items-center gap-3">
        {/* Space for hamburger menu button (button is positioned fixed in Sidebar) */}
        <div className="w-11 h-11 flex-shrink-0" />
        
        {/* Page Title - Fills remaining width and wraps if needed */}
        <h1 className="flex-1 text-lg font-bold text-gray-900 leading-tight">
          {title}
        </h1>
      </div>
    </div>
  );
}
