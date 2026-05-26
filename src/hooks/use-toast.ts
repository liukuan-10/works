export function useToast() {
  return {
    toast: ({ title, variant }: { title: string; variant?: string }) => {
      console.log(title, variant)
    },
  }
}
