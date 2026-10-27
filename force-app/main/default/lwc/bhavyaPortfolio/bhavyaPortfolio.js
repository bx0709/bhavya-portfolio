import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import getAllSections      from '@salesforce/apex/PortfolioDataController.getAllSections';
import getLastSyncTime    from '@salesforce/apex/PortfolioDataController.getLastSyncTime';
import getPublishedPosts  from '@salesforce/apex/BlogController.getPublishedPosts';

// ─── FALLBACK DEFAULTS ────────────────────────────────────────────────────────
// Used when Salesforce data hasn't been synced yet (first load / no network).
const DEFAULTS = {
    hero: {
        firstName:  'Bhavya',
        lastName:   'Gulati',
        tagline:    'Building scalable Salesforce solutions with Apex, LWC & complex integrations.',
        location:   'Gurugram, Haryana',
        experience: '4+ Years Experience',
        certCount:  4,
        linkedin:   'https://linkedin.com/in/bhavya-gulati',
        contactSub: 'Looking to collaborate on complex Salesforce projects or discuss architectural best practices?'
    },
    contact: {
        email:        'bhavya.gulati0709@gmail.com',
        phone:        '+91 9872403217',
        linkedinLabel:'linkedin.com/in/bhavya-gulati'
    },
    certifications: [
        { id:'c1', name:'Platform Developer II' },
        { id:'c2', name:'Platform Developer' },
        { id:'c3', name:'Agentforce Specialist' },
        { id:'c4', name:'Platform App Builder' },
        { id:'c5', name:'Platform Administrator' }
    ],
    heroStats: [
        { id:'h1', num:'4+',   label:'Years Experience' },
        { id:'h2', num:'5×',   label:'Certified' }
    ],
    skills: {
        core: [
            { id:'s1', name:'Apex',                     pct:95, style:'width:95%' },
            { id:'s2', name:'Lightning Web Components',  pct:92, style:'width:92%' },
            { id:'s3', name:'SOQL / SOSL',              pct:90, style:'width:90%' },
            { id:'s4', name:'Flow Builder',             pct:88, style:'width:88%' },
            { id:'s5', name:'Visualforce',              pct:82, style:'width:82%' },
            { id:'s6', name:'Agentforce',               pct:80, style:'width:80%' }
        ],
        cloud: [
            { id:'cl1', name:'Sales Cloud',      pct:90, style:'width:90%' },
            { id:'cl2', name:'Service Cloud',    pct:85, style:'width:85%' },
            { id:'cl3', name:'Experience Cloud', pct:80, style:'width:80%' },
            { id:'cl4', name:'REST / SOAP API',  pct:88, style:'width:88%' }
        ],
        tools: ['Git','BitBucket','GitHub','CI/CD','DevOps Centre','JavaScript','Java','C++','HTML/CSS']
    },
    experience: [
        {
            id:'e1', role:'Salesforce Developer', company:'OneCom',
            period:'Nov 2024 – Present', dotClass:'timeline-dot timeline-dot--current',
            bullets:[
                { id:'b1', text:'Revamped delivery logic (DPD→DHL) with a dynamic carrier assignment system using Scheduled Apex.', chip:'−30% processing time' },
                { id:'b2', text:'Integrated third-party backup solution, optimizing storage and switching to a lower-cost plan.', chip:'~$6K saved/yr' },
                { id:'b3', text:'Led CTI migration from Vonage to Five9 in Lightning — LWC/Apex Actions improved call center UI.', chip:null },
                { id:'b4', text:'Mentored junior developers; led peer code reviews on Apex and LWC best practices.', chip:null }
            ]
        },
        {
            id:'e2', role:'Engineer II', company:'Cvent',
            period:'Jun 2022 – Nov 2024', dotClass:'timeline-dot',
            bullets:[
                { id:'b5', text:'Built "Custom Upload Utility" — bulk upload 1,000+ records via Excel with LWC/Apex.', chip:'−50% manual entry' },
                { id:'b6', text:'Automated "Contract Audit" via REST API, reconciling contract details seamlessly.', chip:'−60% user clicks' },
                { id:'b7', text:'Managed Git/Bitbucket version control and streamlined CI/CD pipelines across environments.', chip:null }
            ]
        }
    ],
    awards: [
        { id:'a1', icon:'🏔️', title:'Mountain Movers Award',      desc:'Recognized for the "Customer Listening System" project delivery.' },
        { id:'a2', icon:'👏', title:'Pat on the Back — Multiple', desc:'Multiple peer awards for on-call support on "Quote to Cash Revamp".' },
        { id:'a3', icon:'💰', title:'$6K Annual Savings',         desc:'Cost reduction via third-party backup solution integration at OneCom.' },
        { id:'a4', icon:'⚡', title:'50% Data Entry Reduction',   desc:'Custom Upload Utility enabled 1,000+ record bulk uploads via Excel.' },
        { id:'a5', icon:'🎯', title:'60% Fewer User Clicks',      desc:'Contract Audit automation saves users 20–30 minutes per session.' },
        { id:'a6', icon:'🏅', title:'4× Salesforce Certified',    desc:'Platform Developer · Agentforce Specialist · App Builder · Admin.' }
    ],
    community: [
        { id:'cm1', icon:'🎤', title:'Community Speaker',              sub:'Sessions on "Winter \'26 Release" & "Governor Limits" — Delhi NCR (2025).' },
        { id:'cm2', icon:'🎪', title:'Volunteer Lead — Delhi Dreamin\'', sub:'Event coordination for 700+ attendees, North India\'s largest Salesforce event (2025 & 2026).' },
        { id:'cm3', icon:'🏅', title:'VP Education — Toastmasters',    sub:'Mentored members on public speaking, Chandigarh (2025).' }
    ],
    education: {
        school: 'Punjab Engineering College, Chandigarh',
        degree: 'B.Tech — Computer Science & Engineering',
        years:  '2018 – 2022',
        cgpa:   '8.3'
    }
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function safeParseSection(sectionsMap, key) {
    try {
        const raw = sectionsMap && sectionsMap[key];
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error(`[Portfolio] JSON parse error for section "${key}":`, e);
        return null;
    }
}

function withStyle(skills) {
    return (skills || []).map((s, i) => ({
        ...s,
        id: s.id || `sk-${i}`,
        style: `width:${s.pct}%`
    }));
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default class BhavyaPortfolio extends NavigationMixin(LightningElement) {

    @track _sectionsMap  = null;
    @track _lastSyncTime = null;
    @track _wiredError   = false;
    @track _dataLoaded   = false;  // explicit flag to trigger template re-render

    _wiredSectionsResult = null;
    _wiredSyncTimeResult = null;

    _canvasInit = false;
    _animFrame  = null;
    _particles  = [];
    _resizeHandler = null;

    // ─── WIRE: ALL SECTIONS ─────────────────────────────────────────────────
    // @wire serves the cached result instantly so the page never flashes blank.
    // Cacheable=true ensures guest users can access the data.
    @wire(getAllSections)
    wiredSections(result) {
        this._wiredSectionsResult = result;
        const { data, error } = result;
        console.log('[Portfolio] Wire received - data:', data, 'error:', error);
        if (data && Object.keys(data).length > 0) {
            console.log('[Portfolio] Data keys:', Object.keys(data));
            console.log('[Portfolio] Setting _sectionsMap and _dataLoaded=true');
            // Create a new object reference to ensure reactivity
            this._sectionsMap = { ...data };
            this._wiredError  = false;
            this._dataLoaded  = true;
            console.log('[Portfolio] _sectionsMap is now set, _dataLoaded:', this._dataLoaded);
        } else if (error) {
            console.error('[Portfolio] Wire error (getAllSections):', error);
            console.error('[Portfolio] Error details:', JSON.stringify(error));
            this._wiredError = true;
            this._dataLoaded = false;
        }
    }

    @wire(getLastSyncTime)
    wiredSyncTime(result) {
        this._wiredSyncTimeResult = result;
        if (result.data) this._lastSyncTime = result.data;
    }

    @track _blogPosts    = [];
    @track _blogError    = false;
    @track _blogLoaded   = false;

    @wire(getPublishedPosts)
    wiredBlogPosts({ data, error }) {
        this._blogLoaded = true;
        if (data) {
            this._blogPosts = data;
            this._blogError = false;
        } else if (error) {
            this._blogError = true;
            this._blogPosts = [];
        }
    }

    get blogLoading()   { return !this._blogLoaded; }
    get hasBlogPosts()  { return this._blogPosts && this._blogPosts.length > 0; }
    get latestPosts()   { return this._blogPosts.slice(0, 3); }

    // ─── DERIVED PROPERTIES ──────────────────────────────────────────────────

    get isLoading() {
        return !this._dataLoaded && !this._wiredError;
    }

    get hasError() { return this._wiredError; }

    get syncBadgeClass() {
        return this._wiredError ? 'sync-badge sync-badge--error' : 'sync-badge';
    }

    get lastSynced() {
        if (!this._lastSyncTime) return null;
        try {
            return new Date(this._lastSyncTime).toLocaleString('en-IN', {
                day:'2-digit', month:'short', year:'numeric',
                hour:'2-digit', minute:'2-digit'
            });
        } catch (e) { return this._lastSyncTime; }
    }

    // ─── HERO ────────────────────────────────────────────────────────────────
    get heroData() {
        const sfData = safeParseSection(this._sectionsMap, 'hero');
        return sfData ? { ...DEFAULTS.hero, ...sfData } : DEFAULTS.hero;
    }

    get heroStats() {
        const sfData = safeParseSection(this._sectionsMap, 'hero');
        return (sfData && sfData.stats) ? sfData.stats : DEFAULTS.heroStats;
    }

    get contactEmail() { return `mailto:${this.contactData.email}`; }
    get contactPhone()  { return `tel:${this.contactData.phone}`;   }

    get contactData() {
        const sfData = safeParseSection(this._sectionsMap, 'contact');
        return sfData ? { ...DEFAULTS.contact, ...sfData } : DEFAULTS.contact;
    }

    // ─── CERTIFICATIONS ──────────────────────────────────────────────────────
    get certifications() {
        const sfData = safeParseSection(this._sectionsMap, 'certifications');
        return (sfData && sfData.items) ? sfData.items : DEFAULTS.certifications;
    }

    // ─── SKILLS ──────────────────────────────────────────────────────────────
    get coreSkills() {
        const sfData = safeParseSection(this._sectionsMap, 'skills');
        return withStyle((sfData && sfData.core) ? sfData.core : DEFAULTS.skills.core);
    }

    get cloudSkills() {
        const sfData = safeParseSection(this._sectionsMap, 'skills');
        return withStyle((sfData && sfData.cloud) ? sfData.cloud : DEFAULTS.skills.cloud);
    }

    get toolTags() {
        const sfData = safeParseSection(this._sectionsMap, 'skills');
        return (sfData && sfData.tools) ? sfData.tools : DEFAULTS.skills.tools;
    }

    // ─── EXPERIENCE ──────────────────────────────────────────────────────────
    get experiences() {
        const sfData = safeParseSection(this._sectionsMap, 'experience');
        // Use Salesforce data items, or wrapped fallback, or fallback directly
        const list = (sfData && sfData.items) ? sfData.items : 
                     (sfData && Array.isArray(sfData)) ? sfData : 
                     DEFAULTS.experience;
        return list.map((exp, idx) => ({
            ...exp,
            id: exp.id || `exp-${idx}`,
            dotClass: idx === 0 ? 'timeline-dot timeline-dot--current' : 'timeline-dot',
            bullets: (exp.bullets || []).map((b, bi) => ({ ...b, id: b.id || `b-${idx}-${bi}` }))
        }));
    }

    // ─── AWARDS ──────────────────────────────────────────────────────────────
    get awards() {
        const sfData = safeParseSection(this._sectionsMap, 'awards');
        // Use Salesforce data items, or fallback directly
        return (sfData && sfData.items) ? sfData.items : 
               (sfData && Array.isArray(sfData)) ? sfData : 
               DEFAULTS.awards;
    }

    // ─── COMMUNITY ───────────────────────────────────────────────────────────
    get communityItems() {
        const sfData = safeParseSection(this._sectionsMap, 'community');
        // Use Salesforce data items, or fallback directly
        return (sfData && sfData.items) ? sfData.items : 
               (sfData && Array.isArray(sfData)) ? sfData : 
               DEFAULTS.community;
    }

    // ─── EDUCATION ───────────────────────────────────────────────────────────
    get educationData() {
        const sfData = safeParseSection(this._sectionsMap, 'education');
        return sfData ? { ...DEFAULTS.education, ...sfData } : DEFAULTS.education;
    }

    // ─── LIFECYCLE ───────────────────────────────────────────────────────────
    renderedCallback() {
        console.log('[Portfolio] renderedCallback - _dataLoaded:', this._dataLoaded, '_canvasInit:', this._canvasInit);
        
        // Initialize canvas and particles only once
        if (!this._canvasInit) {
            this._canvasInit = true;
            this._initParticles();
        }
        
        // Re-initialize scroll observer when data loads (to catch newly rendered elements)
        if (this._dataLoaded) {
            console.log('[Portfolio] Data is loaded, initializing scroll observer');
            this._initScrollObserver();
        }
    }

    disconnectedCallback() {
        if (this._animFrame)     cancelAnimationFrame(this._animFrame);
        if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
    }

    // ─── PARTICLES ───────────────────────────────────────────────────────────
    _initParticles() {
        const canvas = this.template.querySelector('.particle-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        this._resizeHandler = resize;
        window.addEventListener('resize', resize);

        this._particles = Array.from({ length: 18 }, () => ({
            x: Math.random() * 1.2 - 0.1, y: Math.random() * 1.2 - 0.1,
            vx: (Math.random() - 0.5) * 0.0002,
            vy: (Math.random() - 0.5) * 0.0001 - 0.00005,
            size: 12 + Math.random() * 28, alpha: 0.06 + Math.random() * 0.14
        }));

        const cloud = (cx, cy, s) => {
            ctx.beginPath();
            ctx.arc(cx, cy, s*.5,0,Math.PI*2); ctx.arc(cx+s*.4,cy-s*.15,s*.35,0,Math.PI*2);
            ctx.arc(cx+s*.8,cy,s*.4,0,Math.PI*2); ctx.arc(cx+s*.3,cy+s*.3,s*.3,0,Math.PI*2);
            ctx.arc(cx+s*.7,cy+s*.3,s*.25,0,Math.PI*2);
        };

        const loop = () => {
            const W = canvas.width, H = canvas.height;
            ctx.clearRect(0,0,W,H);
            this._particles.forEach(p => {
                ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = '#00A1E0';
                cloud(p.x*W, p.y*H, p.size); ctx.fill(); ctx.restore();
                p.x += p.vx; p.y += p.vy;
                if (p.y < -0.15) p.y=1.1; if (p.x < -0.15) p.x=1.1; if (p.x > 1.15) p.x=-0.1;
            });
            this._animFrame = requestAnimationFrame(loop);
        };
        loop();
    }

    // ─── SCROLL OBSERVER ─────────────────────────────────────────────────────
    _initScrollObserver() {
        const els = this.template.querySelectorAll('[data-animate="true"]');
        console.log('[Portfolio] _initScrollObserver - found', els.length, 'elements with data-animate="true"');
        
        if (!els.length) return;
        
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => { 
                if (e.isIntersecting) {
                    console.log('[Portfolio] Element intersecting, adding visible class');
                    e.target.classList.add('visible'); 
                }
            });
        }, { threshold: 0.05 }); // Lowered threshold from 0.12 to 0.05 for earlier triggering
        
        els.forEach((el, i) => { 
            el.style.transitionDelay = (i % 6 * 0.08) + 's'; 
            obs.observe(el);
            // Immediately add visible class for elements already in viewport
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                console.log('[Portfolio] Element already in viewport, adding visible class immediately');
                el.classList.add('visible');
            }
        });
    }

    // ─── NAV ─────────────────────────────────────────────────────────────────
    handleNavClick(event) {
        event.preventDefault();
        const id = (event.currentTarget.getAttribute('href') || '').slice(1);
        const el = this.template.querySelector('#' + id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    handleBlogNav() {
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: { name: 'blog__c' }
        });
    }

    handleBlogPostClick(event) {
        const slug = event.currentTarget.dataset.slug;
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: { name: 'blogDetail__c' },
            state: { slug }
        });
    }
}