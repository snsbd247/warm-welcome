-- Add missing feature sections to landing page
INSERT INTO landing_sections (id, section_type, title, subtitle, description, is_active, sort_order, metadata) VALUES
(gen_random_uuid(), 'feature', 'HR & Payroll', 'কর্মী ব্যবস্থাপনা ও বেতন', 'কর্মী তথ্য, অ্যাটেনডেন্স, লোন ম্যানেজমেন্ট, স্যালারি শীট এবং প্রভিডেন্ট ফান্ড — সবকিছু এক সিস্টেমে।', true, 16, '{}'),
(gen_random_uuid(), 'feature', 'Inventory Management', 'পণ্য ও ডিভাইস ম্যানেজমেন্ট', 'প্রোডাক্ট ক্যাটালগ, সিরিয়াল ট্র্যাকিং, কাস্টমার ডিভাইস অ্যাসাইনমেন্ট এবং স্টক লগ পরিচালনা।', true, 17, '{}'),
(gen_random_uuid(), 'feature', 'Reseller Management', 'রিসেলার ম্যানেজমেন্ট', 'রিসেলার ওয়ালেট, কমিশন ক্যালকুলেশন, প্যাকেজ অ্যাক্সেস কন্ট্রোল এবং ইমপারসোনেশন সাপোর্ট।', true, 18, '{}'),
(gen_random_uuid(), 'feature', 'Supplier Management', 'সাপ্লায়ার ম্যানেজমেন্ট', 'সাপ্লায়ার প্রোফাইল, পার্চেজ অর্ডার, পেমেন্ট ট্র্যাকিং এবং লেজার ম্যানেজমেন্ট।', true, 19, '{}'),
(gen_random_uuid(), 'feature', 'Support Tickets', 'সাপোর্ট টিকেট', 'কাস্টমার কমপ্লেইন ট্র্যাকিং, প্রায়োরিটি ম্যানেজমেন্ট এবং রেজোলিউশন হিস্টোরি।', true, 20, '{}'),
(gen_random_uuid(), 'feature', 'Payment Gateway', 'পেমেন্ট গেটওয়ে', 'bKash, Nagad সহ মার্চেন্ট পেমেন্ট ইন্টিগ্রেশন এবং অনলাইন বিল পেমেন্ট সাপোর্ট।', true, 21, '{}'),
(gen_random_uuid(), 'feature', 'Network Map', 'নেটওয়ার্ক ম্যাপ', 'ইন্টারেক্টিভ ম্যাপে রাউটার, OLT, স্প্লিটার এবং কাস্টমার লোকেশন ভিজুয়ালাইজেশন।', true, 22, '{}'),
(gen_random_uuid(), 'feature', 'Multi-Tenant SaaS', 'মাল্টি-টেন্যান্ট SaaS', 'একাধিক ISP কোম্পানিকে একটি প্ল্যাটফর্ম থেকে সম্পূর্ণ আইসোলেটেড ভাবে পরিচালনা।', true, 23, '{}');