-- Create profiles for any existing users who don't have them
INSERT INTO public.profiles (id, email, full_name)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', '') as full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;