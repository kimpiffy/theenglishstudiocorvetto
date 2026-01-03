"""
URL configuration for the_english_studio project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns

urlpatterns = [
    # Language switching (keep this outside)
    path('i18n/', include('django.conf.urls.i18n')),
]

urlpatterns += i18n_patterns(
    path("contact/", include("contact.urls")),
    path(
        "gallery/",
        TemplateView.as_view(template_name="gallery.html"),
        name="gallery",
    ),
    path('admin/', admin.site.urls),
    path('', include('main.urls')),
    path('schedule/', include('schedule.urls')),
    path('portal/', include(('portal.urls', 'portal'), namespace='portal')),
    path('blog/', include('blog.urls')),
    path('flyers/', include('flyers.urls')),
)


# Custom error handlers
handler404 = "main.views.not_found"
handler500 = "main.views.server_error"

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL, document_root=settings.MEDIA_ROOT
    )

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(
        settings.STATIC_URL, document_root=settings.STATIC_ROOT
    )
