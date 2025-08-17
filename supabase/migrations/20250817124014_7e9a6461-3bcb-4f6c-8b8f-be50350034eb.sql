-- Update the handle_new_user function to include additional profile data from registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    phone,
    date_of_birth,
    address,
    emergency_contact_name,
    emergency_contact_phone,
    medical_conditions,
    allergies
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    CASE 
      WHEN NEW.raw_user_meta_data->>'date_of_birth' != '' 
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::date 
      ELSE NULL 
    END,
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    COALESCE(NEW.raw_user_meta_data->>'emergency_contact_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'emergency_contact_phone', ''),
    CASE 
      WHEN NEW.raw_user_meta_data->'medical_conditions' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'medical_conditions'))
      ELSE ARRAY[]::text[]
    END,
    CASE 
      WHEN NEW.raw_user_meta_data->'allergies' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'allergies'))
      ELSE ARRAY[]::text[]
    END
  );
  RETURN NEW;
END;
$function$;