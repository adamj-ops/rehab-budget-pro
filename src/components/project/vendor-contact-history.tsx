'use client'

import * as React from 'react'
import type { VendorContact, ContactType, Project } from '@/types'
import { CONTACT_TYPE_LABELS } from '@/types'
import { cn, formatCurrency } from '@/lib/utils'
import { useVendorContacts } from '@/hooks/use-vendor-contacts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  IconPlus,
  IconPhone,
  IconMessage,
  IconMail,
  IconUser,
  IconMapPin,
  IconClipboard,
  IconReceipt,
  IconCheck,
  IconCheckbox,
  IconCash,
  IconDots,
  IconTrash,
  IconCalendar,
  IconAlertCircle,
  IconLoader2,
} from '@tabler/icons-react'

interface VendorContactHistoryProps {
  vendorId: string
  projects?: Project[]
  className?: string
}

const CONTACT_TYPE_ICONS: Record<ContactType, React.ElementType> = {
  phone_call: IconPhone,
  text_message: IconMessage,
  email: IconMail,
  in_person: IconUser,
  site_visit: IconMapPin,
  quote_request: IconClipboard,
  quote_received: IconReceipt,
  job_assigned: IconCheck,
  job_completed: IconCheckbox,
  payment: IconCash,
  other: IconDots,
}

const CONTACT_TYPES: ContactType[] = [
  'phone_call',
  'text_message',
  'email',
  'in_person',
  'site_visit',
  'quote_request',
  'quote_received',
  'job_assigned',
  'job_completed',
  'payment',
  'other',
]

interface ContactFormData {
  contact_type: ContactType
  contact_date: string
  subject: string
  notes: string
  project_id: string | null
  follow_up_date: string | null
}

const defaultFormData: ContactFormData = {
  contact_type: 'phone_call',
  contact_date: new Date().toISOString().slice(0, 16),
  subject: '',
  notes: '',
  project_id: null,
  follow_up_date: null,
}

export function VendorContactHistory({
  vendorId,
  projects = [],
  className,
}: VendorContactHistoryProps) {
  const {
    contacts,
    isLoading,
    createContact,
    updateContact,
    deleteContact,
    completeFollowUp,
  } = useVendorContacts(vendorId)

  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [formData, setFormData] = React.useState<ContactFormData>(defaultFormData)

  const updateField = <K extends keyof ContactFormData>(
    field: K,
    value: ContactFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    try {
      await createContact.mutateAsync({
        vendor_id: vendorId,
        contact_type: formData.contact_type,
        contact_date: formData.contact_date,
        subject: formData.subject.trim() || null,
        notes: formData.notes.trim() || null,
        project_id: formData.project_id,
        follow_up_date: formData.follow_up_date,
        follow_up_completed: false,
      })
      setFormData(defaultFormData)
      setIsAddOpen(false)
    } catch (error) {
      console.error('Failed to create contact:', error)
    }
  }

  const handleDelete = async (contactId: string) => {
    if (confirm('Delete this contact record?')) {
      try {
        await deleteContact.mutateAsync(contactId)
      } catch (error) {
        console.error('Failed to delete contact:', error)
      }
    }
  }

  const handleCompleteFollowUp = async (contactId: string) => {
    try {
      await completeFollowUp.mutateAsync(contactId)
    } catch (error) {
      console.error('Failed to complete follow-up:', error)
    }
  }

  // Group contacts by date
  const groupedContacts = React.useMemo(() => {
    const groups: Record<string, typeof contacts> = {}
    contacts.forEach((contact) => {
      const date = new Date(contact.contact_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      if (!groups[date]) groups[date] = []
      groups[date].push(contact)
    })
    return groups
  }, [contacts])

  // Pending follow-ups
  const pendingFollowUps = contacts.filter(
    (c) => c.follow_up_date && !c.follow_up_completed
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">
          Contact History
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsAddOpen(true)}
          className="h-7 text-xs"
        >
          <IconPlus className="h-3 w-3 mr-1" />
          Log Contact
        </Button>
      </div>

      {/* Pending Follow-ups */}
      {pendingFollowUps.length > 0 && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20 p-3 space-y-2">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <IconAlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium">
              {pendingFollowUps.length} Pending Follow-up
              {pendingFollowUps.length > 1 ? 's' : ''}
            </span>
          </div>
          {pendingFollowUps.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-yellow-800 dark:text-yellow-300">
                {contact.follow_up_date &&
                  new Date(contact.follow_up_date).toLocaleDateString()}
                {contact.subject && ` - ${contact.subject}`}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCompleteFollowUp(contact.id)}
                className="h-6 px-2 text-xs text-yellow-700 hover:text-yellow-900"
              >
                <IconCheck className="h-3 w-3 mr-1" />
                Done
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Contact List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-8">
          <IconPhone className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No contact history</p>
          <p className="text-xs text-muted-foreground">
            Log calls, emails, and meetings
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedContacts).map(([date, dateContacts]) => (
            <div key={date} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{date}</p>
              {dateContacts.map((contact) => {
                const Icon = CONTACT_TYPE_ICONS[contact.contact_type]
                return (
                  <div
                    key={contact.id}
                    className="group flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">
                            {CONTACT_TYPE_LABELS[contact.contact_type]}
                          </p>
                          {contact.subject && (
                            <p className="text-sm text-foreground">
                              {contact.subject}
                            </p>
                          )}
                          {contact.notes && (
                            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                              {contact.notes}
                            </p>
                          )}
                          {contact.projects && (
                            <p className="text-xs text-primary mt-1">
                              Re: {contact.projects.name}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <IconTrash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(contact.contact_date).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Add Contact Sheet */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Log Contact</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            {/* Contact Type */}
            <div className="space-y-2">
              <Label>Contact Type</Label>
              <Select
                value={formData.contact_type}
                onValueChange={(value) =>
                  updateField('contact_type', value as ContactType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_TYPES.map((type) => {
                    const Icon = CONTACT_TYPE_ICONS[type]
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {CONTACT_TYPE_LABELS[type]}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Date/Time */}
            <div className="space-y-2">
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.contact_date}
                onChange={(e) => updateField('contact_date', e.target.value)}
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label>Subject (optional)</Label>
              <Input
                value={formData.subject}
                onChange={(e) => updateField('subject', e.target.value)}
                placeholder="Brief description..."
              />
            </div>

            {/* Project */}
            {projects.length > 0 && (
              <div className="space-y-2">
                <Label>Related Project (optional)</Label>
                <Select
                  value={formData.project_id || 'none'}
                  onValueChange={(value) =>
                    updateField('project_id', value === 'none' ? null : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Details about the conversation..."
                rows={4}
              />
            </div>

            {/* Follow-up */}
            <div className="space-y-2">
              <Label>Follow-up Date (optional)</Label>
              <Input
                type="date"
                value={formData.follow_up_date || ''}
                onChange={(e) =>
                  updateField('follow_up_date', e.target.value || null)
                }
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createContact.isPending}
                className="flex-1"
              >
                {createContact.isPending ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
