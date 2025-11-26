interface SidePanelProps {
  title: string;
  children: React.ReactNode;
}

export default function SidePanel({ title, children }: SidePanelProps) {
  return (
    <div className="bg-white border-l p-4">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}
