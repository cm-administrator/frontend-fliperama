import { Loader2Icon } from "lucide-react";
import { mergeClasses } from "../../lib/mergeClasses";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={mergeClasses("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
