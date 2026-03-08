import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { TanStackQueryProvider } from "./TanStackQueryProvider";
import { ConfirmDialogProvider } from "../../components/dialog/useConfirmDialog";

export const AppProvider = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <TanStackQueryProvider>
      {/* <AuthProvider> */}
        <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
      {/* </AuthProvider> */}
    </TanStackQueryProvider>
  </BrowserRouter>
);
