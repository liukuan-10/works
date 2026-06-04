"use client"

import * as React from "react"
import { X } from "lucide-react"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  return <>{children}</>
}

const DialogTrigger = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => {
  return <div onClick={onClick}>{children}</div>
}

const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }>(
  ({ className, onClose, children, ...props }, ref) => (
    <div
      ref={ref}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${className || ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose()
      }}
      {...props}
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        {children}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  )
)
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 text-left mb-4 ${className || ""}`} {...props} />
)

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={`text-lg font-semibold leading-none tracking-tight ${className || ""}`} {...props} />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={`text-sm text-gray-600 ${className || ""}`} {...props} />
))
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
}
