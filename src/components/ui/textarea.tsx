
import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    React.useImperativeHandle(ref, () => internalRef.current!);

    React.useEffect(() => {
        const textarea = internalRef.current;
        if (textarea) {
            // We need to reset the height to 'auto' before setting the new scrollHeight.
            // This allows the textarea to shrink if the content is deleted.
            textarea.style.height = 'auto'; 
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [props.value, internalRef]);


    return (
      <textarea
        className={cn(
          'flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-y-hidden',
          className
        )}
        ref={internalRef}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
