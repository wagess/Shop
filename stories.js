// Place ici tout le JS de ton <script> actuel, sans balise <script>.
// (Copie-colle tout le contenu du <script> de stories.html ici, sans rien changer)

// Données des stories
const stories = {
    nature: {
        title: "Évasion Nature",
        description: "Une immersion dans les paysages sauvages",
        date: "Mars 2024",
        photos: 5,
        images: [
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
            "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800",
            "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800",
            "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800",
            "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800",
            "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800",
            "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800",
            "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800",
            "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800"
        ],
        captions: [
            "Texte pour la photo 1",
            "Texte pour la photo 2",
            "Texte pour la photo 3",
            "Texte pour la photo 4",
            "Texte pour la photo 5",
            "Texte pour la photo 6",
            "Texte pour la photo 7",
            "Texte pour la photo 8",
            "Texte pour la photo 9",
            "Texte pour la photo 10"
        ]
    },
    urban: {
        title: "Ville en Mouvement",
        description: "L'énergie urbaine capturée",
        date: "Février 2024",
        photos: 4,
        images: [
            "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800",
            "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800",
            "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800",
            "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800"
        ],
        captions: [
            "Texte pour la photo 1",
            "Texte pour la photo 2",
            "Texte pour la photo 3",
            "Texte pour la photo 4"
        ]
    },
    portrait: {
        title: "Portraits Intimistes",
        description: "Des regards qui racontent des histoires",
        date: "Janvier 2024",
        photos: 6,
        images: [
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800",
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800",
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800"
        ],
        captions: [
            "Texte pour la photo 1",
            "Texte pour la photo 2",
            "Texte pour la photo 3",
            "Texte pour la photo 4",
            "Texte pour la photo 5",
            "Texte pour la photo 6"
        ]
    },
    abstract: {
        title: "Abstraction Créative",
        description: "Jeux de lumières et de formes",
        date: "Décembre 2023",
        photos: 5,
        images: [
            "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800",
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
            "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800",
            "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800",
            "https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=800"
        ],
        captions: [
            "Texte pour la photo 1",
            "Texte pour la photo 2",
            "Texte pour la photo 3",
            "Texte pour la photo 4",
            "Texte pour la photo 5"
        ]
    }
};

// Variables globales
let currentStory = null;
let currentSlideIndex = 0;
let progressInterval = null;
let touchStartX = 0;
let touchEndX = 0;

// Éléments DOM
const gallery = document.getElementById('gallery');
const storiesViewer = document.getElementById('storiesViewer');
const storySlides = document.getElementById('storySlides');
const storyProgress = document.getElementById('storyProgress');
const shareOptions = document.getElementById('shareOptions');
const shareBtn = document.getElementById('shareBtn');
const closeBtn = document.getElementById('closeBtn');
const prevSlideBtn = document.getElementById('prevSlideBtn');
const nextSlideBtn = document.getElementById('nextSlideBtn');
const toast = document.getElementById('toast');

// Générer la galerie
function generateGallery() {
    Object.keys(stories).forEach(storyId => {
        const story = stories[storyId];
        const card = document.createElement('div');
        card.className = 'story-card';
        card.setAttribute('data-story', storyId);
        card.innerHTML = `
            <div class="story-image" style="background-image: url('${story.images[0]}')"></div>
            <div class="story-info">
                <div class="story-title">${story.title}</div>
                <div class="story-description">${story.description}</div>
                <div class="story-meta">
                    <span>📅 ${story.date}</span>
                    <span>📸 ${story.photos} photos</span>
                </div>
            </div>
        `;
        // Correction ici :
        card.addEventListener('click', () => {
            currentSlideIndex = 0;
            openStory(storyId);
            updateSlide();
        });
        gallery.appendChild(card);
    });
}

// Ouvrir une story
function openStory(storyId) {
    currentStory = stories[storyId];

    // Générer les slides (aucune classe active ici)
    storySlides.innerHTML = '';
    currentStory.images.forEach((image, index) => {
        const slideDiv = document.createElement('div');
        slideDiv.className = 'story-slide';

        if (currentStory.captions && currentStory.captions[index]) {
            const caption = document.createElement('div');
            caption.className = 'story-caption';
            caption.textContent = currentStory.captions[index];
            slideDiv.appendChild(caption);
        }

        const img = document.createElement('img');
        img.src = image;
        img.alt = `${currentStory.title} - Photo ${index + 1}`;
        slideDiv.appendChild(img);

        storySlides.appendChild(slideDiv);
    });

    // Générer les barres de progression
    storyProgress.innerHTML = '';
    currentStory.images.forEach(() => {
        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        bar.innerHTML = '<div class="progress-fill"></div>';
        storyProgress.appendChild(bar);
    });

    // Afficher le viewer
    storiesViewer.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Démarrer la barre de progression
function startProgress() {
    clearInterval(progressInterval);
    const progressBars = document.querySelectorAll('.progress-fill');
    const currentBar = progressBars[currentSlideIndex];
    
    let progress = 0;
    const duration = 10000; // 5 secondes
    const interval = 50;
    const increment = (interval / duration) * 100;
    
    progressInterval = setInterval(() => {
        progress += increment;
        currentBar.style.width = `${Math.min(progress, 100)}%`;
        
        if (progress >= 100) {
            clearInterval(progressInterval);
            nextSlide();
        }
    }, interval);
}

// Slide suivante
function nextSlide() {
    const slides = document.querySelectorAll('.story-slide');
    
    if (currentSlideIndex < slides.length - 1) {
        currentSlideIndex++;
        updateSlide();
    } else {
        closeStory();
    }
}

// Slide précédente
function prevSlide() {
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        updateSlide();
    }
}

// Mettre à jour la slide courante
function updateSlide() {
    const slides = document.querySelectorAll('.story-slide');
    const progressBars = document.querySelectorAll('.progress-fill');
    
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === currentSlideIndex);
    });
    
    progressBars.forEach((bar, index) => {
        if (index < currentSlideIndex) {
            bar.style.width = '100%';
        } else if (index === currentSlideIndex) {
            bar.style.width = '0%';
        } else {
            bar.style.width = '0%';
        }
    });
    
    const storyId = Object.keys(stories).find(key => stories[key] === currentStory);
    updateURL(storyId, currentSlideIndex);
    
    startProgress();
}

// Fermer la story
function closeStory() {
    clearInterval(progressInterval);
    storiesViewer.classList.remove('active');
    shareOptions.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Réinitialiser l'URL
    history.replaceState(null, '', window.location.pathname);
}

// Ouvrir les options de partage
function toggleShareOptions() {
    shareOptions.classList.toggle('active');
}

// Mettre à jour l'URL
function updateURL(storyId, slideIndex) {
    const newUrl = `${window.location.pathname}?story=${storyId}&slide=${slideIndex}`;
    history.replaceState(null, '', newUrl);
}

// Partager sur les réseaux sociaux
async function shareToSocial(platform) {
    const storyId = Object.keys(stories).find(key => stories[key] === currentStory);
    const pageUrl = `${window.location.origin}${window.location.pathname}?story=${storyId}&slide=${currentSlideIndex}`;
    const storyTitle = currentStory.title;
    const currentSlide = document.querySelector('.story-slide.active');
    const imageUrl = currentSlide ? currentSlide.src : '';
    
    // Web Share API natif (principalement mobile)
    if (platform === 'native' && navigator.share) {
        try {
            await navigator.share({
                title: storyTitle,
                text: `Découvrez "${storyTitle}"`,
                url: pageUrl
            });
            showToast('✅ Partagé avec succès !');
            shareOptions.classList.remove('active');
            trackEvent('share', 'native');
            return;
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.log('Erreur de partage:', err);
            }
            return;
        }
    }
    
    let shareUrl = '';
    
    switch(platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(storyTitle)}&url=${encodeURIComponent(pageUrl)}`;
            break;
        case 'instagram':
            downloadImage(imageUrl, `${storyTitle.replace(/\s+/g, '_')}_${currentSlideIndex + 1}.jpg`);
            showToast('📸 Image téléchargée ! Partagez-la sur Instagram depuis votre galerie.');
            shareOptions.classList.remove('active');
            trackEvent('share', 'instagram');
            return;
        case 'whatsapp':
            shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(storyTitle + '\n' + pageUrl)}`;
            break;
        case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
            break;
        case 'copy':
            try {
                await navigator.clipboard.writeText(pageUrl);
                showToast('✅ Lien copié dans le presse-papiers !');
                shareOptions.classList.remove('active');
                trackEvent('share', 'copy');
            } catch (err) {
                showToast('❌ Erreur lors de la copie du lien');
            }
            return;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
        shareOptions.classList.remove('active');
        trackEvent('share', platform);
    }
}

// Télécharger une image
function downloadImage(url, filename) {
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        })
        .catch(err => {
            console.error('Erreur de téléchargement:', err);
            showToast('❌ Erreur lors du téléchargement');
        });
}

// Afficher une notification toast
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Tracking simple
function trackEvent(action, label) {
    console.log(`📊 Event: ${action} - ${label}`);
    // Intégrez ici Google Analytics ou autre
    // gtag('event', action, {'event_label': label});
}

// Support tactile (swipe)
storySlides.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

storySlides.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
        clearInterval(progressInterval);
        nextSlide();
    }
    if (touchEndX > touchStartX + swipeThreshold) {
        clearInterval(progressInterval);
        prevSlide();
    }
}

// Navigation clavier
document.addEventListener('keydown', (e) => {
    if (storiesViewer.classList.contains('active')) {
        if (e.key === 'ArrowRight') {
            clearInterval(progressInterval);
            nextSlide();
        } else if (e.key === 'ArrowLeft') {
            clearInterval(progressInterval);
            prevSlide();
        } else if (e.key === 'Escape') {
            closeStory();
        }
    }
});

// Event listeners
shareBtn.addEventListener('click', toggleShareOptions);
closeBtn.addEventListener('click', closeStory);
prevSlideBtn.addEventListener('click', () => {
    clearInterval(progressInterval);
    prevSlide();
});
nextSlideBtn.addEventListener('click', () => {
    clearInterval(progressInterval);
    nextSlide();
});

// Partage sur les réseaux
document.querySelectorAll('.share-option').forEach(option => {
    option.addEventListener('click', function() {
        const platform = this.getAttribute('data-platform');
        shareToSocial(platform);
    });
});

// Fermer le menu de partage en cliquant à l'extérieur
document.addEventListener('click', (e) => {
    if (!shareOptions.contains(e.target) && e.target !== shareBtn && !shareBtn.contains(e.target)) {
        shareOptions.classList.remove('active');
    }
});

// Charger une story depuis l'URL au démarrage
window.addEventListener('DOMContentLoaded', () => {
    generateGallery();
    
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get('story');
    const slideIndex = urlParams.get('slide');
    
    if (storyId && stories[storyId]) {
        currentSlideIndex = slideIndex ? parseInt(slideIndex) : 0;
        openStory(storyId);
        updateSlide();
    }
});