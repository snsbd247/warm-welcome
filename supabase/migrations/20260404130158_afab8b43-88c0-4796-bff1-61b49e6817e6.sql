UPDATE smtp_settings 
SET host = 'mail.syncsolutionbd.com', 
    port = 465, 
    username = 'info@syncsolutionbd.com', 
    password = 'sAgor@#$2300bd', 
    encryption = 'ssl', 
    from_email = 'info@syncsolutionbd.com', 
    from_name = 'Smart ISP App', 
    updated_at = now() 
WHERE id = 'aefc258b-2a25-470d-92f4-edcb301ba922';