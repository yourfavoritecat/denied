-- Create patient_history table for medical/dental records
CREATE TABLE public.patient_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  allergies TEXT,
  blood_type TEXT,
  medications TEXT,
  conditions TEXT,
  surgeries TEXT,
  pasted_history TEXT,
  last_dental_cleaning TEXT,
  current_dentist TEXT,
  dental_issues TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.patient_history ENABLE ROW LEVEL SECURITY;

-- Users can only access their own history
CREATE POLICY "Users can view own patient history" ON public.patient_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patient history" ON public.patient_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patient history" ON public.patient_history FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_patient_history_updated_at
  BEFORE UPDATE ON public.patient_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();