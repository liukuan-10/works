"use client"

import * as React from "react"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const SelectTrigger = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className || ""}`} ref={ref} {...props}>
    {children}
  </select>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder }: { placeholder?: string }) => <>{placeholder}</>

const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <option value={value}>{children}</option>
)

const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>

const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>

const SelectRoot = ({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => onValueChange(e.target.value)

  return (
    <select value={value} onChange={handleChange} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
      {children}
    </select>
  )
}

export {
  SelectRoot as Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
}
