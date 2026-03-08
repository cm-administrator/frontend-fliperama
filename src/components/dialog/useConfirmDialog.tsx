import { createContext, useContext, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./Dialog";
import { Button } from "../button/button";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(
  null,
);

export const useConfirm = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmDialogProvider");
  }
  return context.confirm;
};

export const ConfirmDialogProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(
    null,
  );

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleConfirm = () => {
    resolver?.(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    resolver?.(false);
    setIsOpen(false);
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{options.title}</DialogTitle>
              <DialogDescription>{options.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={handleCancel}>
                {options.cancelLabel || "Cancelar"}
              </Button>
              <Button
                variant={options.variant || "default"}
                onClick={handleConfirm}
              >
                {options.confirmLabel || "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </ConfirmDialogContext.Provider>
  );
};
