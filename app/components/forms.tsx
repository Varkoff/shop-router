import { useInputControl } from '@conform-to/react'
import * as SelectPrimitive from "@radix-ui/react-select"
import { type OTPInputProps, REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp'
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import type React from 'react'
import { useCallback, useEffect, useId, useState } from 'react'
import { cn } from '~/lib/utils'
import { Checkbox, type CheckboxProps } from './ui/checkbox'
import { Input } from './ui/input'
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from './ui/input-otp'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Textarea } from './ui/textarea'

export type ListOfErrors = Array<string | null | undefined> | null | undefined

export function ErrorList({
    id,
    errors,
}: {
    errors?: ListOfErrors
    id?: string
}) {
    const errorsToRender = errors?.filter(Boolean)
    if (!errorsToRender?.length) return null
    return (
        <ul id={id} className="flex flex-col gap-1">
            {errorsToRender.map((e) => (
                <li key={e} className="text-destructive text-[10px]">
                    {e}
                </li>
            ))}
        </ul>
    )
}

export function Field({
    labelProps,
    inputProps,
    errors,
    className,
}: {
    labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
    inputProps: React.InputHTMLAttributes<HTMLInputElement>
    errors?: ListOfErrors
    className?: string
}) {
    const fallbackId = useId()
    const id = inputProps.id ?? fallbackId
    const errorId = errors?.length ? `${id}-error` : undefined
    return (
        <div className={cn("flex flex-col gap-1", className)}>
            <Label htmlFor={id} {...labelProps} />
            <Input
                id={id}
                aria-invalid={errorId ? true : undefined}
                aria-describedby={errorId}
                {...inputProps}
            />
            <div className="min-h-[32px] px-4 pt-1 pb-3">
                {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
            </div>
        </div>
    )
}

export function OTPField({
    labelProps,
    inputProps,
    errors,
    className,
}: {
    labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
    inputProps: Partial<OTPInputProps & { render: never }>
    errors?: ListOfErrors
    className?: string
}) {
    const fallbackId = useId()
    const id = inputProps.id ?? fallbackId
    const errorId = errors?.length ? `${id}-error` : undefined
    return (
        <div className={className}>
            <Label htmlFor={id} {...labelProps} />
            <InputOTP
                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                maxLength={6}
                id={id}
                aria-invalid={errorId ? true : undefined}
                aria-describedby={errorId}
                {...inputProps}
            >
                <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                </InputOTPGroup>
            </InputOTP>
            <div className="min-h-[32px] px-4 pt-1 pb-3">
                {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
            </div>
        </div>
    )
}

export function TextareaField({
    labelProps,
    textareaProps,
    errors,
    className,
}: {
    labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
    textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>
    errors?: ListOfErrors
    className?: string
}) {
    const fallbackId = useId()
    const id = textareaProps.id ?? textareaProps.name ?? fallbackId
    const errorId = errors?.length ? `${id}-error` : undefined
    return (
        <div className={className}>
            <Label htmlFor={id} {...labelProps} />
            <Textarea
                id={id}
                aria-invalid={errorId ? true : undefined}
                aria-describedby={errorId}
                {...textareaProps}
            />
            <div className="min-h-[32px] px-4 pt-1 pb-3">
                {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
            </div>
        </div>
    )
}

export function CheckboxField({
    labelProps,
    buttonProps,
    errors,
    className,
}: {
    labelProps: React.ComponentProps<'label'>
    buttonProps: CheckboxProps & {
        name: string
        form: string
        value?: string
    }
    errors?: ListOfErrors
    className?: string
}) {
    const { key, defaultChecked, ...checkboxProps } = buttonProps
    const fallbackId = useId()
    const checkedValue = buttonProps.value ?? 'on'
    const input = useInputControl({
        key,
        name: buttonProps.name,
        formId: buttonProps.form,
        initialValue: defaultChecked ? checkedValue : undefined,
    })
    const id = buttonProps.id ?? fallbackId
    const errorId = errors?.length ? `${id}-error` : undefined

    return (
        <div className={className}>
            <div className="flex gap-2">
                <Checkbox
                    {...checkboxProps}
                    id={id}
                    aria-invalid={errorId ? true : undefined}
                    aria-describedby={errorId}
                    checked={input.value === checkedValue}
                    onCheckedChange={(state) => {
                        input.change(state.valueOf() ? checkedValue : '')
                        buttonProps.onCheckedChange?.(state)
                    }}
                    onFocus={(event) => {
                        input.focus()
                        buttonProps.onFocus?.(event)
                    }}
                    onBlur={(event) => {
                        input.blur()
                        buttonProps.onBlur?.(event)
                    }}
                    type="button"
                />
                <Label
                    htmlFor={id}
                    {...labelProps}
                    className="text-body-xs text-muted-foreground self-center"
                />
            </div>
            <div className="px-4 pt-1 pb-3">
                {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
            </div>
        </div>
    )
}

export function PriceField({
    labelProps,
    inputProps,
    errors,
    className,
}: {
    labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
    inputProps: React.InputHTMLAttributes<HTMLInputElement>
    errors?: ListOfErrors
    className?: string
}) {
    const fallbackId = useId()
    const id = inputProps.id ?? fallbackId
    const errorId = errors?.length ? `${id}-error` : undefined

    const [displayValue, setDisplayValue] = useState('')
    const [isEditing, setIsEditing] = useState(false)

    // Convert cents to euros for display
    const centsToEuros = useCallback((cents: string | number): string => {
        const numCents = typeof cents === 'string' ? parseInt(cents) || 0 : cents
        return (numCents / 100).toFixed(2)
    }, [])

    // Convert euros to cents
    const eurosToCents = useCallback((euros: string): number => {
        const numEuros = parseFloat(euros) || 0
        return Math.round(numEuros * 100)
    }, [])

    // Initialize display value from input value
    useEffect(() => {
        if (inputProps.value !== undefined && typeof inputProps.value !== 'object') {
            setDisplayValue(centsToEuros(inputProps.value))
        } else if (inputProps.defaultValue !== undefined && typeof inputProps.defaultValue !== 'object') {
            setDisplayValue(centsToEuros(inputProps.defaultValue))
        }
    }, [inputProps.value, inputProps.defaultValue, centsToEuros])

    const handleClick = () => {
        setIsEditing(true)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value

        // Allow only numbers and one decimal point
        if (!/^\d*\.?\d{0,2}$/.test(value)) return

        setDisplayValue(value)

        // Convert to cents and call original onChange
        const centsValue = eurosToCents(value)
        const syntheticEvent = {
            ...e,
            target: {
                ...e.target,
                value: centsValue.toString(),
                name: inputProps.name || '',
            }
        }
        inputProps.onChange?.(syntheticEvent)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsEditing(true)
        inputProps.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsEditing(false)
        // Format to 2 decimal places on blur
        if (displayValue) {
            const formatted = parseFloat(displayValue).toFixed(2)
            setDisplayValue(formatted)

            const centsValue = eurosToCents(formatted)
            const syntheticEvent = {
                ...e,
                target: {
                    ...e.target,
                    value: centsValue.toString(),
                    name: inputProps.name || '',
                }
            }
            inputProps.onChange?.(syntheticEvent)
        }
        inputProps.onBlur?.(e)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
            e.currentTarget.blur()
        }
    }

    const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsEditing(true)
        }
    }

    const formattedPrice = displayValue ? parseFloat(displayValue).toFixed(2) : '0.00'
    const centsValue = eurosToCents(displayValue)

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <Label htmlFor={id} {...labelProps} />

            {/* Hidden input for form submission */}
            <input
                type="hidden"
                name={inputProps.name}
                value={centsValue}
            />

            {/* Display container */}
            <button
                type="button"
                className={cn(
                    "relative group cursor-text w-full text-left",
                    "border rounded-lg px-4 py-3",
                    "bg-muted/30 hover:bg-muted/50 transition-colors",
                    "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                    "focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none",
                    errorId && "border-destructive focus-within:ring-destructive focus:ring-destructive"
                )}
                onClick={handleClick}
                onKeyDown={handleContainerKeyDown}
                tabIndex={isEditing ? -1 : 0}
                aria-label="Modifier le prix"
                disabled={isEditing}
            >
                {/* Currency symbol */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg font-medium">
                    €
                </div>

                {/* Price display/input */}
                {isEditing ? (
                    <input
                        {...inputProps}
                        id={id}
                        type="text"
                        value={displayValue}
                        onChange={handleInputChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className={cn(
                            "w-full bg-transparent outline-none",
                            "text-right text-2xl font-mono font-bold",
                            "pl-8 pr-4"
                        )}
                        placeholder="0.00"
                        aria-invalid={errorId ? true : undefined}
                        aria-describedby={errorId}
                        ref={(input) => {
                            if (input && isEditing) {
                                setTimeout(() => input.focus(), 0)
                            }
                        }}
                    />
                ) : (
                    <div
                        className={cn(
                            "text-right text-2xl font-mono font-bold",
                            "pl-8 pr-4 py-1",
                            "text-foreground/90"
                        )}
                    >
                        {formattedPrice}
                    </div>
                )}



                {/* Edit indicator */}
                {!isEditing && (
                    <div className="absolute inset-0 rounded-lg border-2 border-dashed border-transparent group-hover:border-muted-foreground/20 transition-colors" />
                )}
            </button>

            <div className="min-h-[32px] px-4 pt-1 pb-3">
                {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
            </div>
        </div>
    )
}

export function SelectField({
    labelProps,
    selectProps,
    errors,
    className,
    placeholder,
    options,
}: {
    labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
    selectProps: React.ComponentProps<typeof SelectPrimitive.Root> & {
        name: string
        form: string
        defaultValue?: string
    }
    errors?: ListOfErrors
    className?: string
    placeholder?: string
    options: Array<{ value: string; label: string }>
}) {
    const { name, form, defaultValue, ...rootProps } = selectProps

    const fallbackId = useId()
    const id = name ?? fallbackId
    const errorId = errors?.length ? `${id}-error` : undefined

    const input = useInputControl({
        name,
        initialValue: defaultValue,
        formId: form,
    })

    return (
        <div className={cn("flex flex-col gap-1 w-full", className)}>
            <Label htmlFor={id} {...labelProps} />
            <SelectPrimitive.Root
                value={input.value || defaultValue}
                onValueChange={(value) => {
                    input.change(value)
                }}
                {...rootProps}
            >
                <SelectPrimitive.Trigger
                    id={id}
                    aria-invalid={errorId ? true : undefined}
                    aria-describedby={errorId}
                    className={cn(
                        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-9"
                    )}
                >
                    <SelectPrimitive.Value placeholder={placeholder} />
                    <SelectPrimitive.Icon asChild>
                        <ChevronDownIcon className="size-4 opacity-50" />
                    </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>
                <SelectPrimitive.Portal>
                    <SelectPrimitive.Content
                        className={cn(
                            "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md"
                        )}
                        position="popper"
                    >
                        <SelectPrimitive.Viewport
                            className="p-1 h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
                        >
                            {options.map((option) => (
                                <SelectPrimitive.Item
                                    key={option.value}
                                    value={option.value}
                                    className={cn(
                                        "focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                    )}
                                >
                                    <span className="absolute right-2 flex size-3.5 items-center justify-center">
                                        <SelectPrimitive.ItemIndicator>
                                            <CheckIcon className="size-4" />
                                        </SelectPrimitive.ItemIndicator>
                                    </span>
                                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                                </SelectPrimitive.Item>
                            ))}
                        </SelectPrimitive.Viewport>
                    </SelectPrimitive.Content>
                </SelectPrimitive.Portal>
            </SelectPrimitive.Root>
            <input type="hidden" name={name} value={input.value || defaultValue || ''} />
            <div className="min-h-[32px] px-4 pt-1 pb-3">
                {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
            </div>
        </div>
    )
}

export function SwitchField({
    labelProps,
    switchProps,
    errors,
    className,
}: {
    labelProps: React.ComponentProps<'label'>
    switchProps: React.ComponentProps<typeof Switch> & {
        name: string
        form: string
        value?: string
    }
    errors?: ListOfErrors
    className?: string
}) {
    const { key, defaultChecked, ...restSwitchProps } = switchProps
    const fallbackId = useId()
    const checkedValue = switchProps.value ?? 'on'
    const input = useInputControl({
        key,
        name: switchProps.name,
        formId: switchProps.form,
        initialValue: defaultChecked ? checkedValue : undefined,
    })
    const id = switchProps.id ?? fallbackId
    const errorId = errors?.length ? `${id}-error` : undefined

    return (
        <div className={className}>
            <div className="flex items-center gap-2">
                <Switch
                    {...restSwitchProps}
                    id={id}
                    aria-invalid={errorId ? true : undefined}
                    aria-describedby={errorId}
                    checked={input.value === checkedValue}
                    onCheckedChange={(checked) => {
                        input.change(checked ? checkedValue : '')
                        switchProps.onCheckedChange?.(checked)
                    }}
                    onFocus={(event) => {
                        input.focus()
                        switchProps.onFocus?.(event)
                    }}
                    onBlur={(event) => {
                        input.blur()
                        switchProps.onBlur?.(event)
                    }}
                />
                <div className="grid gap-1.5 leading-none">
                    <Label
                        htmlFor={id}
                        {...labelProps}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    />
                </div>
            </div>
            <div className="px-4 pt-1 pb-3">
                {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
            </div>
        </div>
    )
}