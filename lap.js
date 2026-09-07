(function () {
    'use strict';

    function initMobileGpbxTiles() {
        if (!window.Lampa) return;

        // Внедряем CSS стили, адаптированные под экраны смартфонов
        injectMobileCSS();

        // Фоновый таймер: проверяет DOM каждые 300мс на наличие мобильных строк серий
        setInterval(function() {
            // Ищем любые элементы серий от gpbx или стандартной Лампы на телефоне
            // В мобильной версии классы могут быть .online-season__episode, .episodes__item или просто .selector
            var mobileItems = $('.online-season__episode, .episodes__item, .plugins__episode, .full-start__buttons ~ div .selector').filter(function() {
                var text = $(this).text().toLowerCase();
                var isEpisode = text.indexOf('серия') > -1 || text.indexOf('эпизод') > -1 || text.match(/\d+\s+сер/i);
                return isEpisode && !$(this).hasClass('mobile-tile-card');
            });

            if (mobileItems.length > 0) {
                var container = mobileItems.parent();
                
                // Превращаем контейнер в мобильную скролл-ленту
                if (!container.hasClass('mobile-tiles-container')) {
                    container.addClass('mobile-tiles-container');
                }

                buildMobileTiles(mobileItems);
            }
        }, 300);
    }

    function buildMobileTiles(items) {
        items.each(function (index, element) {
            var item = $(element);
            var epNum = index + 1;
            
            // Вытаскиваем чистый текст названия без лишних пробелов
            var rawTitle = item.text().replace(/\s+/g, ' ').trim();
            var title = rawTitle || `${epNum} серия`;

            // Сохраняем длительность, если плагин её выводит
            var duration = item.find('.plugins__episode-duration, .duration').text() || '—';

            // Генерируем плашки HDR и кодека (как на вашем фото)
            var tagsHtml = `<span class="m-tag m-tag-hdr">HDR 10+</span><span class="m-tag m-tag-codec">H.265</span>`;
            var defaultImg = 'https://lampa.mx';

            // Создаем новую структуру карточки, которая отлично выглядит на вертикальном экране телефона
            var newMobileTile = $(`
                <div class="mobile-tile-card selector">
                    <div class="mobile-tile-card__preview">
                        <img src="${defaultImg}" class="mobile-tile-card__img" />
                        <div class="mobile-tile-card__duration">${duration}</div>
                    </div>
                    <div class="mobile-tile-card__meta">
                        <div class="mobile-tile-card__tags">${tagsHtml}</div>
                        <h4 class="mobile-tile-card__title">${title}</h4>
                        <p class="mobile-tile-card__desc">Тапните для выбора перевода и запуска серии.</p>
                    </div>
                </div>
            `);

            // Сохраняем все системные атрибуты Лампы, чтобы не сломать клики
            newMobileTile.attr('class', item.attr('class') + ' mobile-tile-card');

            // На телефонах hover:enter может не срабатывать, вешаем прямой клик/тач
            newMobileTile.on('click touchend', function (e) {
                e.preventDefault();
                item.trigger('hover:enter');
                item.click();
            });

            // Заменяем скучную вертикальную строку на красивую горизонтальную карточку
            item.replaceWith(newMobileTile);
        });

        // Принудительно обновляем контроллер Лампы
        if (window.Lampa.Controller) {
            window.Lampa.Controller.refresh();
        }
    }

    function injectMobileCSS() {
        var css = `
            /* Скролл-контейнер для мобильных устройств (разрешаем нативный свайп пальцем) */
            .mobile-tiles-container {
                display: flex !important;
                flex-direction: row !important;
                overflow-x: auto !important;
                overflow-y: hidden !important;
                gap: 14px !important;
                padding: 10px 15px !important;
                white-space: nowrap !important;
                -webkit-overflow-scrolling: touch !important; /* Плавный скролл на iOS */
                clear: both !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            .mobile-tiles-container::-webkit-scrollbar {
                display: none !important; /* Прячем полосу прокрутки */
            }
            
            /* Стилизация карточки серии под мобильный экран */
            .mobile-tile-card {
                display: flex !important;
                flex-direction: column !important;
                width: 240px !important; /* Чуть уже, чем для ТВ, чтобы влезало на экран телефона */
                height: 220px !important;
                flex-shrink: 0 !important;
                background: rgba(255, 255, 255, 0.05) !important;
                border-radius: 10px !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
                padding: 0 !important;
                margin: 0 !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
            
            .mobile-tile-card__preview {
                position: relative !important;
                width: 100% !important;
                height: 120px !important;
                background: #101010 !important;
            }
            .mobile-tile-card__img {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
            }
            .mobile-tile-card__duration {
                position: absolute !important;
                bottom: 6px !important;
                right: 6px !important;
                background: rgba(0, 0, 0, 0.8) !important;
                padding: 1px 5px !important;
                border-radius: 3px !important;
                font-size: 10px !important;
                color: #fff !important;
            }
            
            .mobile-tile-card__meta {
                padding: 8px 10px !important;
                white-space: normal !important;
                text-align: left !important;
            }
            .mobile-tile-card__tags {
                display: flex !important;
                gap: 5px !important;
                margin-bottom: 4px !important;
            }
            
            /* Мобильные теги HDR / Кодек */
            .m-tag {
                font-size: 9px !important;
                font-weight: bold !important;
                padding: 1px 4px !important;
                border-radius: 2px !important;
            }
            .m-tag-hdr { background: #ff9800 !important; color: #000 !important; }
            .m-tag-codec { background: #2196f3 !important; color: #fff !important; }
            
            .mobile-tile-card__title {
                font-size: 13px !important;
                font-weight: bold !important;
                color: #fff !important;
                margin: 0 0 3px 0 !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
            }
            .mobile-tile-card__desc {
                font-size: 11px !important;
                color: #8c8c8c !important;
                margin: 0 !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden;
                line-height: 1.3 !important;
            }
            
            /* Стиль при тапе (визуальный отклик вместо фокуса пульта) */
            .mobile-tile-card:active, .mobile-tile-card.focus {
                background: rgba(255, 255, 255, 0.15) !important;
                border-color: #ffffff !important;
            }
        `;
        if (!$('head style:contains("mobile-tiles-container")').length) {
            $('head').append('<style>' + css + '</style>');
        }
    }

    if (window.Lampa) initMobileGpbxTiles();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') initMobileGpbxTiles(); });
})();
