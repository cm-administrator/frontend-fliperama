import {
  ChartColumn
} from "lucide-react";

export const menus = [
  {
    title: "Playback",
    url: "/",
    icon: ChartColumn,
    isActive: undefined,
    subMenus: undefined,
  },
  // {
  //   title: "Criar Anúncio",
  //   url: "/advertisement",
  //   icon: ClipboardCheck,
  //   isActive: undefined,
  //   subMenus: undefined,
  // },
  // {
  //   title: "Clientes",
  //   url: "/clientes",
  //   icon: Handshake,
  //   isActive: undefined,
  //   subMenus: undefined,
  // },

  // {
  //   title: "Controle de Acesso",
  //   url: "#",
  //   icon: IdCard,
  //   isActive: false,
  //   subMenus: [
  //     {
  //       title: "Usuários",
  //       url: "/usuarios",
  //     },
  //   ],
  // },
] as const;
