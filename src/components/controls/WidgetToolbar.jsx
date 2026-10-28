import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Building blocks for toolbar widgets: the same buttons flow in a row
// (horizontal) or an icon column (vertical, docked to a side edge).

export const ToolbarRoot = ({ orientation, className = '', children }) => (
  <div
    className={`flex ${orientation === 'vertical' ? 'flex-col items-center' : 'flex-row items-center'} gap-1 ${className}`}
  >
    {children}
  </div>
);

export const ToolbarGroup = ({ orientation, className = '', children }) => (
  <div className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'} items-center gap-0.5 ${className}`}>
    {children}
  </div>
);

// A group with a small caption underneath (horizontal ribbon layout)
export const ToolbarSection = ({ caption, children }) => (
  <div className="flex flex-col items-center gap-0.5">
    <div className="flex flex-row items-start gap-0.5">{children}</div>
    <div className="text-[9px] uppercase tracking-wide leading-none text-muted-foreground/80">{caption}</div>
  </div>
);

export const ToolbarSeparator = ({ orientation }) => (
  <div
    aria-hidden="true"
    className={orientation === 'vertical' ? 'h-px w-6 my-1 bg-border/40' : 'w-px h-6 mx-1 bg-border/40'}
  />
);

export const ToolbarButton = React.forwardRef(({
  icon,
  label,
  shortcut,
  tooltipSide = 'bottom',
  active = false,
  primary = false,
  destructive = false,
  className = '',
  iconClassName = 'w-4 h-4',
  // Ribbon style: icon with a short caption underneath
  caption,
  ...props
}, ref) => {
  const Icon = icon;
  const size = caption ? 'h-11 min-w-[52px] px-1.5 flex-col gap-1' : primary ? 'w-10 h-10' : 'w-8 h-8';
  return (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        ref={ref}
        variant={primary || active ? 'default' : 'ghost'}
        size="sm"
        aria-label={label}
        aria-pressed={active || undefined}
        className={`p-0 shrink-0 ${size} ${destructive ? 'text-destructive hover:text-destructive' : ''} ${className}`}
        {...props}
      >
        <Icon className={iconClassName} />
        {caption && <span className="text-[10px] leading-none font-normal">{caption}</span>}
      </Button>
    </TooltipTrigger>
    <TooltipContent side={tooltipSide} className="text-xs">
      <div>{label}</div>
      {shortcut && <div className="text-muted-foreground">{shortcut}</div>}
    </TooltipContent>
  </Tooltip>
  );
});
ToolbarButton.displayName = 'ToolbarButton';
