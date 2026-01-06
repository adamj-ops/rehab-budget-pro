# Supabase Storage Setup for Project Photos

## Create Storage Bucket

Run this SQL in your Supabase SQL Editor or via the Supabase Dashboard:

```sql
-- Create storage bucket for project photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-photos', 'project-photos', false);

-- Set up RLS policies for the bucket
CREATE POLICY "Users can upload photos to own projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view photos from own projects"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete photos from own projects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id = auth.uid()
  )
);
```

## Storage Path Structure

Photos will be stored using this path pattern:
```
project-photos/
  {project_id}/
    {line_item_id}/
      {uuid}.{ext}
```

Example:
```
project-photos/
  550e8400-e29b-41d4-a716-446655440000/
    660e8400-e29b-41d4-a716-446655440001/
      a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
      b2c3d4e5-f6a7-8901-bcde-f12345678901.pdf
```

## File Constraints

- **Accepted types**: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- **Max file size**: 10MB per file
- **Bucket**: Private (requires authentication)

## Dashboard Setup (Alternative)

If you prefer using the Supabase Dashboard:

1. Go to **Storage** in your Supabase project
2. Click **New Bucket**
3. Name: `project-photos`
4. Public: **Off** (keep private)
5. Click **Create Bucket**
6. Click on the bucket, go to **Policies**
7. Add the three policies above using the Policy Editor

## Testing Storage

```typescript
// Example upload in your app
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

async function uploadPhoto(
  projectId: string,
  lineItemId: string,
  file: File
) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${projectId}/${lineItemId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('project-photos')
    .upload(filePath, file);

  if (error) throw error;
  return data.path;
}
```
