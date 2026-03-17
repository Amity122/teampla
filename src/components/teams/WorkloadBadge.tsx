import { Badge } from "@/components/ui/Badge";
import { workloadColor } from "@/lib/utils";

interface WorkloadBadgeProps {
  count: number;
}

export function WorkloadBadge({ count }: WorkloadBadgeProps) {
  const color = workloadColor(count);
  const label = `${count}p`;
  return <Badge variant={color}>{label}</Badge>;
}
