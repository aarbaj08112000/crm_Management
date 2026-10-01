const fs = require('fs');
const file = '/var/www/html/quick-bank/apps/user/src/app/corporate-registration/page.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /<div className="w-full flex flex-col items-start bg-white z-10">\s*<div className="flex-1 w-full max-w-\[1440px\] mx-auto flex flex-col px-\[20px\] md:px-\[32px\] py-\[24px\] md:py-\[32px\]">\s*<button[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/,
    `{step !== 7 && (
                    <div className="w-full flex flex-col items-start bg-white z-10">
                        <div className="flex-1 w-full max-w-[1440px] mx-auto flex flex-col px-[20px] md:px-[32px] py-[24px] md:py-[32px]">
                            <button
                                onClick={handleBack}
                                className="flex items-center text-[#21358b] font-medium text-[15px] hover:text-[#182870] transition-colors self-start"
                            >
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.707 2.40625L4.51953 8.59375L4.13281 8.99805L4.51953 9.40234L10.707 15.5898L11.5156 14.7812L5.73242 8.99805L11.5156 3.21484L10.707 2.40625Z" fill="#293A8D"></path></svg>
                                Back
                            </button>
                        </div>
                    </div>
                    )}`
);

fs.writeFileSync(file, content);
console.log('patched page.js');
