(function () {
    'use strict';

    function initGpbxTiles() {
        if (!window.Lampa) return;

        // Внедряем CSS стили для горизонтального скролла и плиток
        injectStyles();

        // Запускаем постоянный фоновый таймер проверки интерфейса (каждые 400мс)
        // Это гарантирует, что дизайн применится на любом устройстве и плеере
        setInterval(function() {
            // Ищем стандартные строки серий gpbx (обычно они имеют класс .anime-factor, .online-season__episode или просто строки внутри окон)
            var items = $('.online-season__episode, .episodes__item, .full-start__buttons ~ div .selector').filter(function() {
                // Выбираем только те элементы, которые содержат текст серии и еще НЕ были обработаны
                return ($(this).text().indexOf('серия') > -1 || $(this).text().match(/\d+\s+сер/i)) && !$(this).hasClass('gpbx-episode-card');
            });

            if (items.length > 0) {
                // Находим их общий контейнер и превращаем его в горизонтальный флекс
                var container = items.parent();
                if (!container.hasClass('gpbx-episodes-list')) {
                    container.addClass('gpbx-episodes-list');
                }

                transformElementsToTiles(items);
            }
        }, 400);
    }

    function transformElementsToTiles(items) {
        items.each(function (index, element) {
            var item = $(element);
            var epNum = index + 1;
            
            // Вытаскиваем название серии и информацию из оригинальной строки
            var title = item.text().trim() || `${epNum} серия`;
            var duration = item.find('.plugins__episode-duration, .duration').text() || '—';

            // Генерируем бутафорские плашки качества (как на вашем фото)
            var tagsHtml = `<span class="grid-tag tag-hdr">HDR 10+</span><span class="grid-tag tag-codec">H.265</span>`;
            
            // Заглушка для превью-картинки (берем заглушку Лампы)
            var defaultImg = 'https://lampa.mx';

            // Собираем HTML код новой плитки в точности как на фотографии
            var newTile = $(`
                <div class="gpbx-episode-card selector">
                    <div class="gpbx-episode-card__preview">
                        <img src="${defaultImg}" class="gpbx-episode-card__img" />
                        <div class="gpbx-episode-card__duration">${duration}</div>
                    </div>
                    <div class="gpbx-episode-card__meta">
                        <div class="gpbx-episode-card__hdr-tags">${tagsHtml}</div>
                        <h4 class="gpbx-episode-card__title">${title}</h4>
                        <p class="gpbx-episode-card__description">Нажмите для запуска онлайн-просмотра этой серии.</p>
                    </div>
                </div>
            `);

            // Переносим все оригинальные классы навигации (чтобы работал пульт)
            newTile.attr('class', item.attr('class'));
            newTile.addClass('gpbx-episode-card');

            // Привязываем оригинальные события клика/нажатия пульта
            newTile.on('hover:enter click', function () {
                item.trigger('hover:enter');
                item.click();
            });

            // Заменяем старую вертикальную строку на нашу горизонтальную плитку
            item.replaceWith(newTile);
        });

        // Обновляем навигационную сетку Лампы для пульта
        if (window.Lampa.Controller) {
            window.Lampa.Controller.refresh();
        }
    }

    function injectStyles() {
        var css = `
            /* Делаем блок серий горизонтальной лентой */
            .gpbx-episodes-list {
                display: flex !important;
                flex-direction: row !important;
                overflow-x: auto !important;
                gap: 20px !important;
                padding: 15px 20px !important;
                white-space: nowrap !important;
                clear: both !important;
            }
            .gpbx-episodes-list::-webkit-scrollbar {
                display: none !important; /* Убираем полосу прокрутки */
            }
            
            /* Стилизация карточки-плитки под фото */
            .gpbx-episode-card {
                display: flex !important;
                flex-direction: column !important;
                width: 310px !important;
                height: 270px !important;
                flex-shrink: 0 !important;
                background: rgba(255, 255, 255, 0.04) !important;
                border-radius: 10px !important;
                border: 2px solid transparent !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
                padding: 0 !important;
                margin: 0 !important;
                text-align: left !important;
            }
            
            .gpbx-episode-card__preview {
                position: relative !important;
                width: 100% !important;
                height: 155px !important;
                background: #181818 !important;
            }
            .gpbx-episode-card__img {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
            }
            .gpbx-episode-card__duration {
                position: absolute !important;
                bottom: 8px !important;
                right: 8px !important;
                background: rgba(0,0,0,0.8) !important;
                padding: 2px 6px !important;
                border-radius: 4px !important;
                font-size: 11px !important;
                color: #fff !important;
            }
            
            .gpbx-episode-card__meta {
                padding: 12px !important;
                white-space: normal !important;
            }
            .gpbx-episode-card__hdr-tags {
                display: flex !important;
                gap: 6px !important;
                margin-bottom: 6px !important;
            }
            
            /* Плашки HDR и кодека */
            .grid-tag {
                font-size: 10px !important;
                font-weight: bold !important;
                padding: 1px 5px !important;
                border-radius: 3px !important;
                text-transform: uppercase !important;
            }
            .tag-hdr { background: #ff9800 !important; color: #000 !important; }
            .tag-codec { background: #2196f3 !important; color: #fff !important; }
            
            .gpbx-episode-card__title {
                font-size: 15px !important;
                font-weight: bold !important;
                color: #fff !important;
                margin: 0 0 4px 0 !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
            }
            .gpbx-episode-card__description {
                font-size: 12px !important;
                color: #a0a0a0 !important;
                margin: 0 !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
                line-height: 1.4 !important;
            }
            
            /* Эффект выделения рамки пультом */
            .gpbx-episode-card.focus {
                background: rgba(255, 255, 255, 0.12) !important;
                border-color: #ffffff !important;
                transform: scale(1.02) !important;
            }
        `;
        if (!$('head style:contains("gpbx-episodes-list")').length) {
            $('head').append('<style>' + css + '</style>');
        }
    }

    if (window.Lampa) initGpbxTiles();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') initGpbxTiles(); });
})();
