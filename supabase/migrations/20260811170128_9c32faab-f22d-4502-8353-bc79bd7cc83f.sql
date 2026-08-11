
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name text NOT NULL,
  description text,
  duration_min integer NOT NULL DEFAULT 30,
  price_cents integer,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.barbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty text,
  photo_url text,
  work_hours jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.barbers TO service_role;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  barber_id uuid REFERENCES public.barbers(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_cents integer NOT NULL DEFAULT 0,
  duration_min integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'confirmed',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX appointments_starts_at_idx ON public.appointments (starts_at);
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.schedule_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid REFERENCES public.barbers(id) ON DELETE CASCADE,
  block_date date NOT NULL,
  start_time text,
  end_time text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.schedule_blocks TO service_role;
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.business_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  address text NOT NULL,
  phone text NOT NULL,
  instagram text NOT NULL,
  hours jsonb NOT NULL,
  buffer_min integer NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.business_settings TO service_role;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.admin_auth (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  pin_hash text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_auth TO service_role;
ALTER TABLE public.admin_auth ENABLE ROW LEVEL SECURITY;

INSERT INTO public.admin_auth (id, pin_hash) VALUES (1, NULL);

INSERT INTO public.business_settings (id, address, phone, instagram, hours, buffer_min) VALUES (
  1,
  'CLS 315, Bloco B, Loja 29 — Asa Sul, Brasília - DF, 70384-520',
  '(61) 99974-6529',
  '@barbeariasavaya',
  '{"1":{"open":"09:00","close":"20:00"},"2":{"open":"09:00","close":"20:00"},"3":{"open":"09:00","close":"20:00"},"4":{"open":"09:00","close":"20:00"},"5":{"open":"09:00","close":"20:00"},"6":{"open":"09:00","close":"18:00"},"0":null}'::jsonb,
  5
);

INSERT INTO public.services (category, name, duration_min, price_cents, sort_order) VALUES
  ('Cabelo', 'Corte Masculino', 30, NULL, 1),
  ('Cabelo', 'Corte + Barba', 60, NULL, 2),
  ('Cabelo', 'Acabamento (contorno/pezinho)', 15, NULL, 3),
  ('Barba', 'Barba Completa', 30, NULL, 4),
  ('Barba', 'Barboterapia', 40, NULL, 5),
  ('Sobrancelha', 'Design de Sobrancelha', 15, NULL, 6),
  ('Tratamentos', 'Hidratação Capilar', 30, NULL, 7),
  ('Tratamentos', 'Disfarce de Grisalhos', 40, NULL, 8);

INSERT INTO public.barbers (name, specialty, sort_order) VALUES
  ('Equipe Savaya', 'Corte e barba', 1);
