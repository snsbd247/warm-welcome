
-- Add source_type and source_id to fiber_cables for flexible sourcing (olt/core/splitter)
ALTER TABLE public.fiber_cables
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'olt',
  ADD COLUMN IF NOT EXISTS source_id uuid;

-- Add source_type and source_id to fiber_splitters for splitter chaining
ALTER TABLE public.fiber_splitters
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'core',
  ADD COLUMN IF NOT EXISTS source_id uuid;

-- Make core_id nullable on fiber_splitters (splitter can come from output instead)
ALTER TABLE public.fiber_splitters ALTER COLUMN core_id DROP NOT NULL;

-- Add indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_fiber_cables_source ON public.fiber_cables(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_fiber_splitters_source ON public.fiber_splitters(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_fiber_splitter_outputs_connection ON public.fiber_splitter_outputs(connection_type, connected_id);
