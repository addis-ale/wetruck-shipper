import { ColumnDef } from "@tanstack/react-table";
import { Container } from "../../server/types/container.types";
import { ContainerActions } from "../components/container-actions";

export const containerColumns: ColumnDef<Container>[] = [
  {
    accessorKey: "container_number",
    header: "Container No",
  },
  {
    accessorKey: "container_size",
    header: "Size",
  },
  {
    accessorKey: "container_type",
    header: "Type",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    id: "actions",
    cell: ({ row }) => <ContainerActions container={row.original} />,
  },
];
