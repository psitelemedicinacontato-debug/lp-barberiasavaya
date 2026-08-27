
UPDATE public.services SET price_cents = v.p FROM (VALUES
 ('Corte Masculino',7000),('Corte + Barba',11000),('Acabamento (contorno/pezinho)',3500),
 ('Barba Completa',5500),('Barboterapia',7500),('Design de Sobrancelha',3000),
 ('Hidratação Capilar',6000),('Disfarce de Grisalhos',9000)
) AS v(n,p) WHERE public.services.name = v.n AND public.services.price_cents IS NULL;

INSERT INTO public.clients (name, phone, email, notes)
SELECT n, p, e, obs FROM (VALUES
 ('Rafael Andrade','(61) 99812-4471','rafael.andrade@email.com','Prefere máquina 1 nas laterais'),
 ('Lucas Meireles','(61) 99745-2210','lucas.meireles@email.com',NULL),
 ('Bruno Tavares','(61) 98123-9087',NULL,'Barba desenhada quadrada'),
 ('Diego Fontenele','(61) 99655-3312','diego.f@email.com',NULL),
 ('Henrique Salles','(61) 99341-7788','h.salles@email.com','Sempre 18h'),
 ('Marcelo Vidigal','(61) 98877-1203',NULL,NULL),
 ('Thiago Bastos','(61) 99120-4455','thiago.bastos@email.com',NULL),
 ('André Pacheco','(61) 99887-6621',NULL,'Cliente desde 2019'),
 ('Felipe Guimarães','(61) 99233-8890','felipe.g@email.com',NULL),
 ('Gustavo Rangel','(61) 98501-3374',NULL,NULL),
 ('Vinícius Camargo','(61) 99678-1145','vini.camargo@email.com','Alergia a produtos com álcool'),
 ('Eduardo Nasser','(61) 99444-0092',NULL,NULL),
 ('Pedro Lacerda','(61) 99310-5567','pedro.lacerda@email.com',NULL),
 ('Caio Bittencourt','(61) 98765-2231',NULL,NULL),
 ('Leonardo Prado','(61) 99155-8834','leo.prado@email.com','Gosta de conversar pouco'),
 ('Fernando Queiroz','(61) 99022-4478',NULL,NULL),
 ('Rodrigo Sampaio','(61) 99908-1176','rodrigo.s@email.com',NULL),
 ('Matheus Vilela','(61) 98344-9910',NULL,NULL),
 ('Otávio Rebouças','(61) 99277-3358','otavio.r@email.com',NULL),
 ('Ricardo Monteiro','(61) 99811-6640',NULL,'Pai do Otávio, vêm juntos'),
 ('Daniel Cavalcanti','(61) 99566-7712','daniel.c@email.com',NULL),
 ('Sérgio Portela','(61) 98199-2265',NULL,NULL),
 ('Alexandre Duarte','(61) 99733-1108','alexandre.d@email.com',NULL),
 ('Murilo Aragão','(61) 99488-5523',NULL,'Costuma remarcar')
) AS t(n,p,e,obs)
WHERE NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.phone = t.p);

DO $$
DECLARE
  cl uuid[]; bb uuid[]; svc jsonb[];
  d int; i int; n int;
  day date; hour int; minute int;
  starts timestamptz; dur int; total int;
  pick jsonb; st text; cli uuid; bar uuid;
  seedrow int := 0;
BEGIN
  SELECT array_agg(id ORDER BY created_at) INTO cl FROM public.clients;
  SELECT array_agg(id ORDER BY sort_order) INTO bb FROM public.barbers WHERE active;
  SELECT array_agg(x) INTO svc FROM (
    SELECT jsonb_build_array(jsonb_build_object('id',id,'name',name,'duration_min',duration_min,'price_cents',price_cents)) AS x
    FROM public.services WHERE active ORDER BY sort_order
  ) s;
  svc := svc || ARRAY[(
    SELECT jsonb_agg(jsonb_build_object('id',id,'name',name,'duration_min',duration_min,'price_cents',price_cents))
    FROM public.services WHERE name IN ('Corte Masculino','Design de Sobrancelha')
  )];
  svc := svc || ARRAY[(
    SELECT jsonb_agg(jsonb_build_object('id',id,'name',name,'duration_min',duration_min,'price_cents',price_cents))
    FROM public.services WHERE name IN ('Barba Completa','Hidratação Capilar')
  )];

  IF cl IS NULL OR bb IS NULL OR svc IS NULL THEN RETURN; END IF;

  FOR d IN -21..14 LOOP
    day := (now() AT TIME ZONE 'America/Sao_Paulo')::date + d;
    IF extract(dow from day) = 0 THEN CONTINUE; END IF;
    n := 3 + ((abs(d) * 7 + 3) % 4);
    FOR i IN 1..n LOOP
      seedrow := seedrow + 1;
      hour := 9 + ((seedrow * 3 + i * 2) % 10);
      minute := CASE (seedrow % 3) WHEN 0 THEN 0 WHEN 1 THEN 30 ELSE 0 END;
      starts := ((day::text || ' ' || lpad(hour::text,2,'0') || ':' || lpad(minute::text,2,'0') || ':00')::timestamp AT TIME ZONE 'America/Sao_Paulo');
      pick := svc[1 + (seedrow % array_length(svc,1))];
      cli := cl[1 + (seedrow * 5 % array_length(cl,1))];
      bar := bb[1 + (seedrow % array_length(bb,1))];
      SELECT coalesce(sum((e->>'duration_min')::int),30), coalesce(sum(coalesce((e->>'price_cents')::int,0)),0)
        INTO dur, total FROM jsonb_array_elements(pick) e;
      IF d < 0 THEN
        st := CASE WHEN seedrow % 11 = 0 THEN 'cancelled' ELSE 'completed' END;
      ELSE
        st := CASE WHEN seedrow % 17 = 0 THEN 'cancelled' ELSE 'confirmed' END;
      END IF;
      IF EXISTS (SELECT 1 FROM public.appointments a WHERE a.barber_id = bar AND a.starts_at = starts) THEN CONTINUE; END IF;
      INSERT INTO public.appointments (client_id, barber_id, starts_at, ends_at, services, total_cents, duration_min, status, notes)
      VALUES (cli, bar, starts, starts + make_interval(mins => dur), pick, total, dur, st,
        CASE WHEN seedrow % 9 = 0 THEN 'Cliente avisou que pode atrasar 5 min' ELSE NULL END);
    END LOOP;
  END LOOP;
END $$;
