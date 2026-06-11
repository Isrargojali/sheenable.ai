import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:bg-emerald-500/10 group-[.toaster]:text-emerald-700 dark:group-[.toaster]:text-emerald-400 group-[.toaster]:border-emerald-500/20",
          error: "group-[.toaster]:bg-rose-500/10 group-[.toaster]:text-rose-700 dark:group-[.toaster]:text-rose-400 group-[.toaster]:border-rose-500/20",
          warning: "group-[.toaster]:bg-amber-500/10 group-[.toaster]:text-amber-700 dark:group-[.toaster]:text-amber-400 group-[.toaster]:border-amber-500/20",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
