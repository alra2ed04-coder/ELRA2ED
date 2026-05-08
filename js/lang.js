/**
 * Al-Raed SaaS Platform - Language & RTL Manager (Full Rewrite)
 * Handles Arabic ↔ English switching with complete RTL layout support.
 */

const Translations = {
    // Navigation
    'Dashboard':      'لوحة القيادة',
    'Tasks':          'المهام',
    'Team':           'الفريق',
    'Chat':           'المحادثات',
    'Calendar':       'التقويم',
    'Reports':        'التقارير',
    'Settings':       'الإعدادات',
    'My Profile':     'ملفي الشخصي',
    'Audit Logs':     'سجل المراجعة',
    'Admin Panel':    'لوحة المشرف',
    'Projects':       'المشاريع',
    'Clients':        'العملاء',
    'Inventory':      'المخزن',
    'Knowledge Base': 'قاعدة المعرفة',

    // Dashboard
    'Dashboard Overview': 'نظرة عامة',
    'Active Tasks':       'المهام النشطة',
    'Team Members':       'أعضاء الفريق',
    'Upcoming Events':    'المواعيد القادمة',
    'Recent Activity':    'النشاط الأخير',
    'Task Completion':    'نسبة الإنجاز',
    'Welcome back':       'مرحباً بعودتك',
    'Here is your platform summary': 'إليك ملخص لمنصتك اليوم',

    // Auth
    'Al-Raed Platform':   'منصة الرائد',
    'Login':              'تسجيل الدخول',
    'Email Address':      'البريد الإلكتروني',
    'Password':           'كلمة المرور',
    'Full Name':          'الاسم الكامل',
    'Job Title':          'المسمى الوظيفي',
    'Create Account':     'إنشاء حساب',
    'Create an account':  'إنشاء حساب',
    'Login here':         'تسجيل الدخول',
    'Already have an account?': 'لديك حساب بالفعل؟',
    'New here?':          'مستخدم جديد؟',

    // Tasks
    'Task Management':    'إدارة المهام',
    'New Task':           'مهمة جديدة',
    'To Do':              'قيد الانتظار',
    'In Progress':        'قيد التنفيذ',
    'Done':               'منتهية',

    // Team
    'Team Collaboration': 'إدارة الفريق',
    'Add Member':         'إضافة عضو',

    // Calendar
    'Schedule':           'الجدول الزمني',
    'Add Event':          'إضافة موعد',

    // Settings
    'Platform Settings':  'إعدادات المنصة',
    'Display Language':   'لغة العرض',
    'Theme Mode':         'مظهر المنصة',
    'Light Mode':         'الوضع الفاتح',
    'Dark Mode':          'الوضع الداكن',
    'Quick Actions':      'إجراءات سريعة',
    'Edit My Profile':    'تعديل ملفي الشخصي',
    'Manage Team':        'إدارة الفريق',
    'View Audit Logs':    'عرض سجل المراجعة',
    'Logout':             'تسجيل الخروج',

    // Profile
    'My Profile':         'ملفي الشخصي',
    'Edit Profile':       'تعديل الملف الشخصي',
    'Upload Photo':       'رفع صورة',
    'Save Changes':       'حفظ التغييرات',
    'Appearance':         'المظهر',

    // Reports
    'Reports & Analytics': 'التقارير والتحليلات',
    'Tasks Report':        'تقرير المهام',
    'Team Report':         'تقرير الفريق',
    'Download CSV':        'تحميل CSV',

    // Chat
    'Group Chat':          'المحادثة الجماعية',
    'Groups':              'مجموعات',
    'Private':             'خاص',
    'Channels':            'قنوات',
    'Broadcast':           'إذاعة',
    'Type a message...':   'اكتب رسالة...',
    'Platform Chat':       'محادثة المنصة',
    'End-to-end Encrypted':'مشفرة بالكامل',
    'Choose a chat to start': 'اختر محادثة للبدء',
    'Search...':           'بحث...',

    // Common
    'Save':                'حفظ',
    'Cancel':              'إلغاء',
    'Delete':              'حذف',
    'Edit':                'تعديل',
    'Add':                 'إضافة',
    'Search':              'بحث',
    'Close':               'إغلاق',
    'Refresh':             'تحديث',
    'All Users':           'جميع المستخدمين',
    'Total Users':         'إجمالي المستخدمين',
    'Admins':              'المشرفون',
    'Total Tasks':         'إجمالي المهام',
    
    // JS Strings
    'No users found.': 'لا يوجد مستخدمين.',
    'No team members yet. Add your first member!': 'لا يوجد أعضاء في الفريق. أضف العضو الأول!',
    'Select a team member to start chatting': 'اختر عضواً لبدء المحادثة',
    'No messages yet. Say hello! 👋': 'لا توجد رسائل. ابدأ بإلقاء التحية! 👋',
    'No upcoming events.': 'لا توجد مواعيد قادمة.',
    
    // Modals
    'Task Title': 'عنوان المهمة',
    'Description': 'الوصف',
    'Priority': 'الأولوية',
    'Status': 'الحالة',
    'Deadline': 'الموعد النهائي',
    'Attachment URL': 'رابط المرفقات',
    'Sub-tasks': 'المهام الفرعية',
    'Save Task': 'حفظ المهمة',
    'Event Title': 'عنوان الموعد',
    'Date': 'التاريخ',
    'Time (optional)': 'الوقت (اختياري)',
    'Notes': 'ملاحظات',
    'Save Event': 'حفظ الموعد',
    'User': 'المستخدم',
    'Email': 'الإيميل',
    'Role': 'الصلاحية',
    'Title': 'المسمى الوظيفي',
    'Joined': 'تاريخ الانضمام',
    'Actions': 'الإجراءات',
    
    // Dynamic JS Text
    'Super Admin': 'مدير عام',
    'Manager': 'مدير',
    'Member': 'عضو',
    'You': 'أنت',
    'Chat': 'محادثة',
    'Ban Email': 'حظر نهائي',
    'Delete User': 'حذف المستخدم',
    'Reset Password': 'إعادة تعيين كلمة المرور',
    'Manage User': 'إدارة المستخدم',
    'No title set': 'لم يتم تعيين المسمى',
    'No description': 'لا يوجد وصف',
    'View Attachment': 'عرض المرفقات',
    'Stop': 'إيقاف',
    'Start': 'تشغيل',
    'Low': 'منخفضة',
    'Medium': 'متوسطة',
    'High': 'عالية',
    
    // Placeholders
    'e.g., Q3 Marketing Strategy': 'مثال: خطة تسويق الربع الثالث',
    'Task details...': 'تفاصيل المهمة...',
    'Add a sub-task and press +': 'أضف مهمة فرعية واضغط +',
    'https://...': 'https://...',
    'e.g., Doctor Appointment': 'مثال: موعد الطبيب',
    'Additional notes...': 'ملاحظات إضافية...',
    'e.g., Ahmed Ali': 'مثال: أحمد علي',
    'e.g., Developer': 'مثال: مطور',
    'ahmed@example.com': 'ahmed@example.com',
    'Search users...': 'ابحث عن مستخدم...',
    'Search tasks, team, messages...': 'ابحث عن المهام، الفريق، الرسائل...',
    
    // Auth Info
    'A user account will be created automatically with the default password:': 'سيتم إنشاء حساب مستخدم تلقائياً بكلمة مرور افتراضية:',
    'The member should change it after first login.': 'يجب على العضو تغييرها بعد أول تسجيل دخول.',
    'Categories': 'الأقسام',

    // Wiki Categories
    'Company Policies': 'سياسات الشركة',
    'Employee Handbook': 'دليل الموظف',
    'Technical Documentation': 'التعليمات التقنية',
    'Human Resources': 'الموارد البشرية',
    'View All': 'عرض الكل',
    'Read More': 'اقرأ المزيد',
    'No articles found': 'لا توجد مقالات',
    'Please fill all fields': 'برجاء ملء جميع الحقول',
    'Back': 'رجوع',

    // New Modules
    'Project Hub': 'مركز المشاريع',
    'New Project': 'مشروع جديد',
    'Project Name': 'اسم المشروع',
    'Initial Progress (%)': 'نسبة الإنجاز المبدئية (%)',
    'Planning': 'تخطيط',
    'On Hold': 'قيد الانتظار',
    'Completed': 'مكتمل',
    'Save Project': 'حفظ المشروع',
    'Client CRM': 'إدارة العملاء',
    'New Client': 'عميل جديد',
    'Company/Client Name': 'اسم الشركة/العميل',
    'Contact Person': 'الشخص المسؤول',
    'Phone Number': 'رقم الهاتف',
    'Save Client': 'حفظ العميل',
    'Inventory & Assets': 'المخزن والأصول',
    'Add Inventory Item': 'إضافة صنف',
    'Item Name': 'اسم الصنف',
    'Category': 'القسم',
    'Stock Quantity': 'الكمية',
    'Hardware': 'أجهزة',
    'Furniture': 'أثاث',
    'Supplies': 'مستلزمات',
    'Save Item': 'حفظ الصنف',
    'Wiki': 'الويكي',
    'New Knowledge Base Article': 'مقال جديد في قاعدة المعرفة',
    'Article Title': 'عنوان المقال',
    'Content': 'المحتوى',
    'Publish Article': 'نشر المقال',
    'Update Article': 'تحديث المقال',
    'Edit Article': 'تعديل المقال',
    'Total Projects': 'إجمالي المشاريع',
    'Low Stock': 'مخزون منخفض',
    'In Stock': 'متوفر',
    'Unit': 'وحدة',
    'Deals': 'الصفقات',
    'Lead': 'محتمل',
    'Active': 'نشط',
    'General': 'عام',
    'Rent': 'إيجار',
    'Salaries': 'رواتب',
    'Utilities': 'خدمات',
    'Marketing': 'تسويق',
    'Equipment': 'معدات',
    
    // New Translations
    'Store and share files with your team': 'قم بتخزين ومشاركة الملفات مع فريقك',
    'Upload File': 'رفع ملف',
    'All Files': 'جميع الملفات',
    'Cloud Drive': 'السحابة الرقمية',
    'Finance': 'المالية',
    'Inventory': 'المخازن',
    'Clients': 'العملاء',
    'Knowledge Base': 'قاعدة المعرفة',
    'Help Desk': 'الدعم الفني',
    'Tasks Report': 'تقرير المهام',
    'Team Report': 'تقرير الفريق',
    'Financial Report': 'التقرير المالي',
    'Total Revenue': 'إجمالي الإيرادات',
    'Net Profit': 'صافي الربح',
    'Expenses': 'المصروفات',
    'Total Expenses': 'إجمالي المصروفات',
    'Add Income': 'إضافة دخل',
    'Add Expense': 'إضافة مصروف',
    'Manage User': 'إدارة المستخدم',
    'Chat User': 'مراسلة العضو',
    'Delete User': 'حذف المستخدم',
    'Reset Password': 'إعادة تعيين كلمة المرور',
    'Ban Email': 'حظر الإيميل',
    'Role': 'الصلاحية',
    'Status': 'الحالة',
    'Actions': 'الإجراءات',
    'Debtor/Creditor': 'المدين/الدائن',
    'Amount': 'المبلغ',
    'Date': 'التاريخ',
    'Unpaid': 'غير مسدد',
    'Paid': 'مسدد',
    'Overdue': 'متأخر',
    'Due Date': 'تاريخ الاستحقاق',
    'Remaining Debts': 'الديون المتبقية',
    'Paid Debts': 'الديون المسددة',
    'Total Monthly Expenses': 'إجمالي المصاريف الشهرية',
    'Expenses Log': 'سجل المصروفات',
    'Debts Record': 'سجل الديون',
    'Add Debt': 'إضافة دين',
    'Add Expense': 'إضافة مصروف',
    'General': 'عام',
    'Salaries': 'رواتب',
    'Rent': 'إيجار',
    'Utilities': 'خدمات وفواتير',
    'Marketing': 'تسويق',
    'Supplies': 'مستلزمات',
    'Software': 'برمجيات',
    'Other': 'أخرى',
    'Update': 'تحديث',
    'Back': 'رجوع',
    'Remaining Debts': 'الديون المتبقية',
    'Financial Management': 'الإدارة المالية',

    // Dates & Times
    'Sunday': 'الأحد', 'Monday': 'الاثنين', 'Tuesday': 'الثلاثاء', 'Wednesday': 'الأربعاء', 'Thursday': 'الخميس', 'Friday': 'الجمعة', 'Saturday': 'السبت',
    'January': 'يناير', 'February': 'فبراير', 'March': 'مارس', 'April': 'أبريل', 'May': 'مايو', 'June': 'يونيو', 'July': 'يوليو', 'August': 'أغسطس', 'September': 'سبتمبر', 'October': 'أكتوبر', 'November': 'نوفمبر', 'December': 'ديسمبر',
    
    // UI Small Strings
    'Loading...': 'جاري التحميل...',
    'Search users...': 'بحث عن مستخدمين...',
    'Enter new password': 'أدخل كلمة المرور الجديدة',
    'Confirm password': 'تأكيد كلمة المرور',
    'Client': 'العميل',
    'Contact': 'جهة الاتصال',
    'Total Deals': 'إجمالي الصفقات',
    'Timestamp': 'الوقت',
    'Action': 'الإجراء',
    'Target': 'الهدف',
    'All Users': 'كافة المستخدمين',
    'Support Tickets': 'تذاكر الدعم',
    'My Tickets': 'تذاكري',
    'New Ticket': 'تذكرة جديدة',
    'Support Desk': 'مكتب الدعم',
    'Write your reply...': 'اكتب ردك هنا...',
    'Select a ticket to view': 'اختر تذكرة لعرضها',
    'Dashboard Overview': 'نظرة عامة على النظام',
    'Welcome back': 'مرحباً بعودتك',
    'Here is your platform summary': 'إليك ملخص لمنصتك اليوم',
    'New Project': 'مشروع جديد',
    'New Client': 'عميل جديد',
    'Add Expense': 'إضافة مصروف',
    'Upload File': 'رفع ملف',
    'Projects': 'المشاريع',
    'Clients': 'العملاء',
    'Inventory': 'المخازن',
    'Finance': 'المالية',
    'Reports': 'التقارير',
    'Cloud Drive': 'السحابة الرقمية',
    'Help Desk': 'الدعم الفني',
    'Admin Panel': 'لوحة الإدارة',
    'Team': 'الفريق',
    'Chat': 'المحادثات',
    'Tasks': 'المهام',
    'Calendar': 'التقويم',
    'Settings': 'الإعدادات',
    'My Profile': 'ملفي الشخصي',
    'Logout': 'تسجيل الخروج',
    'Appearance': 'المظهر',
    'Account Security': 'أمان الحساب',
    'Theme Mode': 'وضع المظهر',
    'Display Language': 'لغة العرض',
    'Full Name': 'الاسم الكامل',
    'Job Title': 'المسمى الوظيفي',
    'Email Address': 'البريد الإلكتروني',
    'Save Changes': 'حفظ التغييرات',
    'Upload Photo': 'رفع صورة',
    'Task Overview': 'ملخص المهام',
    'Financial Forecasting (AI)': 'توقعات مالية (ذكاء اصطناعي)',
    'Recent Activity': 'آخر الأنشطة',
    'AI Smart Briefing': 'ملخص ذكي',
    'Analyzing data...': 'جاري تحليل البيانات...',
    'Active Tasks': 'المهام النشطة',
    'Upcoming Events': 'المواعيد القادمة',
    'Team Members': 'أعضاء الفريق',
    'Sun': 'أحد', 'Mon': 'اثنين', 'Tue': 'ثلاثاء', 'Wed': 'أربعاء', 'Thu': 'خميس', 'Fri': 'جمعة', 'Sat': 'سبت',

    // Detailed Descriptions & Subtitles
    'Customize language, theme, and workspace preferences': 'خصص اللغة، المظهر، وتفضيلات مساحة العمل',
    'Plan your deadlines and meetings': 'خطط لمواعيدك واجتماعاتك النهائية',
    'Manage your personal information and account settings': 'إدارة معلوماتك الشخصية وإعدادات حسابك',
    'Export actionable data for analysis': 'تصدير البيانات لاتخاذ القرارات والتحليل',
    'Platform activity and security monitoring': 'مراقبة نشاط المنصة والأمن الرقمي',
    'Full control over users, accounts, and platform data': 'تحكم كامل في المستخدمين، الحسابات، وبيانات المنصة',
    'Store and share files with your team': 'تخزين ومشاركة الملفات مع فريقك بشكل آمن',
    'Manage expenses and debts': 'إدارة المصروفات والديون المالية',
    'Manage your projects and team productivity': 'إدارة مشاريعك وإنتاجية الفريق',
    'Track your clients and deals': 'تتبع العملاء والصفقات التجارية',
    'Manage your company assets and inventory': 'إدارة أصول الشركة والمخزون',
    'Company knowledge and documentation': 'دليل الشركة والتوثيق المعرفي',
    'Support tickets and assistance': 'تذاكر الدعم والمساعدة الفنية',
    'Total Revenue': 'إجمالي الإيرادات',
    'Total Expenses': 'إجمالي المصروفات',
    'Net Profit': 'صافي الربح',
    'Expenses': 'المصروفات',
    'Debts': 'الديون',
    'Income': 'الدخل',
    'Add Income': 'إضافة دخل',
    'Add Expense': 'إضافة مصروف',
    'Financial Forecasting': 'توقعات مالية',
    'Task Overview': 'نظرة عامة على المهام',
    'Upcoming Events': 'المواعيد القادمة',
    'Recent Activity': 'النشاط الأخير',
    'Project Name': 'اسم المشروع',
    'Client Name': 'اسم العميل',
    'Item Name': 'اسم الصنف',
    'Status': 'الحالة',
    'Progress': 'التقدم',
    'Action': 'الإجراء',
    'Actions': 'الإجراءات',
    'Save Changes': 'حفظ التغييرات',
    'Cancel': 'إلغاء',
    'Delete': 'حذف',
    'Edit': 'تعديل',
    'View': 'عرض',
    'Download CSV': 'تحميل CSV',
    'Refresh': 'تحديث',
    'Search...': 'بحث...',
    'Search users...': 'بحث عن مستخدمين...',
    'Search tasks...': 'بحث عن مهام...',
    'Search projects...': 'بحث عن مشاريع...',
    'Search articles...': 'بحث عن مقالات...',
    'Upload Photo': 'رفع صورة',
    'Logout of Platform': 'تسجيل الخروج من المنصة',
    'Appearance': 'المظهر',
    'Theme Mode': 'وضع المظهر',
    'Display Language': 'لغة العرض',
    'Full Name': 'الاسم الكامل',
    'Email Address': 'البريد الإلكتروني',
    'Job Title': 'المسمى الوظيفي',
    'Account Security': 'أمان الحساب',
    'Profile Overview': 'نظرة عامة على الملف الشخصي',
    'Active Deals': 'الصفقات النشطة',
    'Total Clients': 'إجمالي العملاء',
    'Total Items': 'إجمالي الأصناف',
    'Low Stock': 'مخزون منخفض',
    'used': 'مستخدمة',
    'Al-Raed Platform': 'منصة الرائد',
    'Login to access your workspace': 'سجل دخولك للوصول إلى مساحة عملك',
    'Login': 'دخول',
    'Create Account': 'إنشاء حساب',
    'Already have an account?': 'لديك حساب بالفعل؟',
    'Login here': 'سجل دخولك هنا',
    'New here?': 'جديد هنا؟',
    'Create an account': 'أنشئ حساباً جديداً',
    'Already have an account?': 'لديك حساب بالفعل؟',
    'Edit Profile': 'تعديل الملف الشخصي',
    'All Files': 'كافة الملفات',
    'No title set': 'لا يوجد مسمى وظيفي',
    'Super Admin': 'مدير عام',
    'Member': 'موظف',
    'Admin': 'مسؤول',
    'Categories': 'التصنيفات',
    'Publish Article': 'نشر مقال',
    'Task Management': 'إدارة المهام',
    'Team Management': 'إدارة الفريق',
    'Organize and track your team\'s progress': 'نظم وتتبع تقدم فريقك في العمل',
    'Members who joined the platform': 'الأعضاء الذين انضموا إلى المنصة',
    'Financial Management': 'الإدارة المالية',
    'Private': 'خاص',
    'Groups': 'المجموعات',
    'Channels': 'القنوات',
    'Add Event': 'إضافة موعد',
    'Schedule': 'الجدول الزمني',
    'New Task': 'مهمة جديدة',
    'Add Inventory Item': 'إضافة صنف مخزني',
    'Task Title': 'عنوان المهمة',
    'Save Task': 'حفظ المهمة',
    'New Event / Appointment': 'موعد / اجتماع جديد',
    'Event Title': 'عنوان الموعد',
    'Export team member list, roles, and emails into a CSV file': 'تصدير قائمة أعضاء الفريق، الأدوار، والبريد الإلكتروني إلى ملف CSV',
    'Export all tasks, their statuses, priorities, and deadlines into a CSV file': 'تصدير كافة المهام وحالاتها وأولوياتها ومواعيدها النهائية إلى ملف CSV',
    'Manage your account session. Ensure you log out when using public or shared devices to protect your platform data and privacy.': 'إدارة جلسة حسابك. تأكد من تسجيل الخروج عند استخدام أجهزة عامة أو مشتركة لحماية بياناتك وخصوصيتك.',
    'Total Projects': 'إجمالي المشاريع',
    'Completed': 'مكتمل',
    'In Progress': 'قيد التنفيذ',
    'Planning': 'قيد التخطيط',
    'Account Security': 'أمان الحساب',
    'Tasks Report': 'تقرير المهام',
    'Team Report': 'تقرير الفريق',
    'Download CSV': 'تحميل CSV',

    // Search & Notifications
    'Search Results': 'نتائج البحث',
    'No results found for': 'لا توجد نتائج لـ',
    'Clear All Notifications': 'مسح كافة التنبيهات',
    'Mark all as read': 'تحديد الكل كمقروء',
    'Search tasks, team, messages...': 'ابحث عن المهام، الفريق، الرسائل...',

    // Chat Management
    'Delete Conversation': 'حذف المحادثة',
    'Are you sure you want to delete this conversation?': 'هل أنت متأكد من حذف هذه المحادثة نهائياً؟',
    'Clear Messages': 'مسح الرسائل',
    'Chat settings': 'إعدادات الدردشة',

    // AI & Dashboard Dynamic
    'Good morning, Director': 'صباح الخير يا مدير',
    'Good afternoon, Director': 'طاب يومك يا مدير',
    'Good evening, Director': 'مساء الخير يا مدير',
    'Hello, Director': 'أهلاً بك يا مدير',
    'You have': 'لديك',
    'open tasks currently': 'مهام مفتوحة حالياً',
    'items need your attention today/tomorrow': 'أشياء محتاجة نظرة منك النهاردة أو بكرة',
    'Great job! You finished more than half the work': 'عاش يا بطل! خلصت أكتر من نص الشغل',
    'Let us get to work and finish what we have': 'يالا بينا نشد الحيل ونخلص اللي ورانا',
    'at': 'في تمام',
    'No recent activity': 'لا يوجد نشاط مؤخرًا'
};

const LangManager = {
    currentLang: localStorage.getItem('al_raed_lang') || 'en',

    init: () => {
        const savedLang = localStorage.getItem('al_raed_lang') || 'en';
        LangManager.currentLang = savedLang;

        // Bind toggle button
        const toggleBtn = document.getElementById('lang-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                LangManager.currentLang = LangManager.currentLang === 'en' ? 'ar' : 'en';
                localStorage.setItem('al_raed_lang', LangManager.currentLang);
                LangManager.applyLanguage();
            });
        }

        // Bind settings select
        const settingLang = document.getElementById('setting-lang');
        if (settingLang) {
            settingLang.value = savedLang;
            settingLang.addEventListener('change', (e) => {
                LangManager.currentLang = e.target.value;
                localStorage.setItem('al_raed_lang', LangManager.currentLang);
                LangManager.applyLanguage();
            });
        }

        LangManager.applyLanguage();
    },

    t: (key) => {
        if (!key) return '';
        if (LangManager.currentLang === 'ar') {
            return Translations[key.trim()] || key;
        }
        return key;
    },

    localizeDate: (dateStr) => {
        if (LangManager.currentLang !== 'ar') return dateStr;
        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return `${days[d.getDay()]}، ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    },

    localizeTime: (timeStr) => {
        if (LangManager.currentLang !== 'ar') return timeStr;
        return timeStr.replace('AM', 'ص').replace('PM', 'م');
    },

    applyLanguage: () => {
        const isAr = LangManager.currentLang === 'ar';
        const html = document.documentElement;

        // Set direction and lang
        html.setAttribute('dir', isAr ? 'rtl' : 'ltr');
        html.setAttribute('lang', isAr ? 'ar' : 'en');

        // Font family
        html.style.fontFamily = isAr ? "'Cairo', 'Inter', sans-serif" : "'Inter', 'Cairo', sans-serif";
        document.body.style.fontFamily = isAr ? "'Cairo', 'Inter', sans-serif" : "'Inter', 'Cairo', sans-serif";

        // Update toggle button label
        const toggleBtn = document.getElementById('lang-toggle');
        if (toggleBtn) toggleBtn.textContent = isAr ? 'EN' : 'AR';

        // Update setting-lang select
        const settingLang = document.getElementById('setting-lang');
        if (settingLang && settingLang.value !== LangManager.currentLang) {
            settingLang.value = LangManager.currentLang;
        }

        // Translate all elements with data-en / data-ar attributes
        document.querySelectorAll('[data-en]').forEach(el => {
            const enText = el.getAttribute('data-en');
            const arText = el.getAttribute('data-ar') || Translations[enText] || enText;
            // Only update direct text nodes, not child elements
            let hasTextNode = false;
            el.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                    node.textContent = isAr ? arText : enText;
                    hasTextNode = true;
                }
            });
            if (!hasTextNode && !el.children.length) {
                el.textContent = isAr ? arText : enText;
            }
        });

        // Translate all elements with data-original (highest priority)
        document.querySelectorAll('[data-original]').forEach(el => {
            const original = el.getAttribute('data-original');
            if (original) {
                const translated = isAr ? (Translations[original] || original) : original;
                let foundTextNode = false;
                el.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
                        node.textContent = translated;
                        foundTextNode = true;
                    }
                });
                if (!foundTextNode && el.children.length === 0) el.textContent = translated;
            }
        });

        // Translate Placeholders
        document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
            let original = el.getAttribute('data-original-ph');
            if (!original) {
                original = el.getAttribute('placeholder');
                el.setAttribute('data-original-ph', original);
            }
            el.setAttribute('placeholder', isAr ? (Translations[original] || original) : original);
        });

        // Deep Scan: Translate ANY visible text that matches a translation key
        if (isAr) {
            LangManager.recursiveTranslate(document.body);
        }

        // Localize dates/times in widgets
        const widgetDate = document.getElementById('widget-date');
        if (widgetDate) {
            const now = new Date();
            widgetDate.textContent = LangManager.localizeDate(now);
        }
        const widgetTime = document.getElementById('widget-time');
        if (widgetTime) {
            const now = new Date();
            let timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            widgetTime.textContent = LangManager.localizeTime(timeStr);
        }

        // Apply RTL layout adjustments
        LangManager.applyRTLLayout(isAr);
    },

    recursiveTranslate: (root) => {
        if (root.nodeType === Node.TEXT_NODE) {
            const text = root.textContent.trim();
            if (text && Translations[text]) {
                root.textContent = Translations[text];
            }
        } else if (root.nodeType === Node.ELEMENT_NODE) {
            // Skip scripts and styles
            if (['SCRIPT', 'STYLE', 'I', 'CANVAS'].includes(root.tagName)) return;
            root.childNodes.forEach(child => LangManager.recursiveTranslate(child));
        }
    },

    applyRTLLayout: (isRTL) => {
        // Notifications position
        const notifDropdown = document.getElementById('notif-dropdown');
        if (notifDropdown) {
            if (isRTL) {
                notifDropdown.style.right = 'auto';
                notifDropdown.style.left = '0';
            } else {
                notifDropdown.style.right = '0';
                notifDropdown.style.left = 'auto';
            }
        }

        // Text alignment for all inputs
        document.querySelectorAll('input, textarea, select').forEach(el => {
            el.style.textAlign = isRTL ? 'right' : 'left';
            el.style.direction = isRTL ? 'rtl' : 'ltr';
        });
    }
};

window.LangManager = LangManager;

document.addEventListener('DOMContentLoaded', () => {
    LangManager.init();
});
