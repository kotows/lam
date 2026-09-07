(function () {
    'use strict';

    // Запускаем логику кастомизации дизайна
    function initTilesDesign() {
        if (!window.Lampa) return;

        // 1. Регистрируем HTML-шаблон для красивой карточки-плитки серии
        Lampa.Template.add('custom_design_episode', `
            <div class="gpbx-episode-card selector">
                <div class="gpbx-episode-card__preview">
                    <img src="{img}" class="gpbx-episode-card__img" />
                    <div class="gpbx-episode-card__duration">{duration}</div>
                </div>
                <div class="gpbx-episode-card__meta">
                    <div class="gpbx-episode-card__hdr-tags">{tags}</div>
                    <h4 class="gpbx-episode-card__title">{title}</h4>
                    <p class="gpbx-episode-card__description">{description}</p>
                </div>
            </div>
        `);

        // 2. Внедряем CSS стили в документ для сборки горизонтальной сетки
        injectCustomCSS();

        // 3. Перехватываем стандартное событие создания активности серий в Lampa
        Lampa.Listener.follow('activity', function (e) {
            // Если Лампа открывает стандартный компонент со списком эпизодов
            if (e.type === 'ready' && (e.component === 'episodes' || e.name === 'episodes')) {
                transformListToTiles(e.object);
            }
        });
    }

    // Функция трансформации стандартного списка в горизонтальные плитки
    function transformListToTiles(activityObject) {
        var page = activityObject.page;
        var card = activityObject.card || {};
        
        // Находим стандартный контейнер, куда Лампа складывает строки серий
        var listContainer = page.find('.episodes__list, .activity__scroll, .browse__items');
        if (!listContainer.length) return;

        // Перестраиваем структуру контейнера под горизонтальный Flexbox
        listContainer.addClass('gpbx-episodes-list');

        // Получаем ID сериала и номер сезона для запроса красивых превью из TMDB
        var tmdbId = card.id;
        var seasonNum = activityObject.season || 1; 

        // Делаем быстрый бесплатный запрос к TMDB, чтобы забрать картинки (кадры) и синопсисы серий
        $.ajax({
            url: `https://themoviedb.org{tmdbId}/season/${seasonNum}?api_key=3fd2be6f0c70a2a598f084ddfb75487c&language=ru-RU`,
            dataType: 'json',
            success: function (tmdbData) {
                if (tmdbData && tmdbData.episodes) {
                    applyTilesData(listContainer, tmdbData.episodes, seasonNum);
                }
            },
            error: function () {
                // Если TMDB недоступен, оставляем дефолтные заглушки, но сетку не ломаем
                applyTilesData(listContainer, [], seasonNum);
            }
        });
    }

    // Замена элементов списка на плитки
    function applyTilesData(container, tmdbEpisodes, seasonNum) {
        // Находим все стандартные элементы серий, которые Лампа уже успела отрисовать
        var standardItems = container.find('.episodes__item, .selector');

        standardItems.each(function (index, element) {
            var item = $(element);
            var epNum = index + 1; // Порядковый номер серии

            // Ищем соответствующие метаданные в массиве из TMDB
            var meta = tmdbEpisodes.find(e => e.episode_number === epNum) || {};

            // Формируем ссылки на картинку и текст
            var imgUrl = meta.still_path ? `https://tmdb.org{meta.still_path}` : 'https://lampa.mx';
            var duration = meta.runtime ? `${meta.runtime} мин.` : '—';
            var description = meta.overview || 'Описание серии недоступно.';
            var title = item.find('.episodes__title').text() || meta.name || `${epNum} серия`;

            // Сохраняем оригинальные обработчики клика (чтобы ваши плагины просмотра продолжали работать!)
            var originalClick = item.data('events') ? item.data('events').click : null;

            // Генерируем бутафорские плашки качества (как на фото) для красоты интерфейса
            var tagsHtml = `<span class="grid-tag tag-hdr">HDR 10+</span><span class="grid-tag tag-codec">H.265</span>`;

            // Создаем новую плитку по нашему зарегистрированному шаблону
            var newTile = Lampa.Template.get('custom_design_episode', {
                img: imgUrl,
                duration: duration,
                season: seasonNum,
                episode: epNum,
                title: title,
                description: description,
                tags: tagsHtml
            });

            // Копируем навигационные классы Lampa на новую плитку
            newTile.attr('class', item.attr('class'));
            newTile.addClass('gpbx-episode-card'); // Добавляем наши CSS-стили

            // Переносим действие клика со старой строки на новую плитку
            newTile.on('hover:enter click', function (e) {
                item.trigger('hover:enter');
                item.click();
            });

            // Заменяем старый скучный элемент списка на новую красивую плитку
            item.replaceWith(newTile);
        });

        // Насильно заставляем контроллер Лампы обновить фокус пульта на новых элементах
        if (window.Lampa.Controller) {
            window.Lampa.Controller.refresh();
        }
    }

    // CSS стили для полной кастомизации (в точности как на фотографии)
    function injectCustomCSS() {
        var css = `
            /* Превращаем вертикальный список серий в горизонтальный ряд */
            .gpbx-episodes-list {
                display: flex !important;
                flex-direction: row !important;
                overflow-x: auto !important;
                gap: 20px !important;
                padding: 15px 20px !important;
                scroll-behavior: smooth;
                white-space: nowrap !important;
            }
            .gpbx-episodes-list::-webkit-scrollbar {
                display: none; /* Скрываем полосу прокрутки браузера */
            }
            
            /* Стилизация контейнера плитки */
            .gpbx-episode-card {
                display: flex !important;
                flex-direction: column !important;
                width: 320px !important;
                height: auto !important;
                flex-shrink: 0;
                background: rgba(255, 255, 255, 0.03) !important;
                border-radius: 12px !important;
                border: 2px solid transparent !important;
                overflow: hidden;
                box-sizing: border-box;
                padding: 0 !important;
                margin: 0 !important;
                text-align: left !important;
            }
            
            /* Превью-картинка серии */
            .gpbx-episode-card__preview {
                position: relative;
                width: 100%;
                height: 165px;
                background: #141414;
            }
            .gpbx-episode-card__img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .gpbx-episode-card__duration {
                position: absolute;
                bottom: 8px;
                right: 8px;
                background: rgba(0,0,0,0.75);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 11px;
                color: #fff;
            }
            
            /* Текстовый блок под картинкой */
            .gpbx-episode-card__meta {
                padding: 12px;
                box-sizing: border-box;
                white-space: normal !important;
            }
            .gpbx-episode-card__hdr-tags {
                display: flex;
                gap: 6px;
                margin-bottom: 6px;
            }
            
            /* Цветные теги качества */
            .grid-tag {
                font-size: 10px;
                font-weight: bold;
                padding: 1px 5px;
                border-radius: 3px;
                text-transform: uppercase;
            }
            .tag-hdr { background: #ff9800; color: #000; }
            .tag-codec { background: #2196f3; color: #fff; }
            
            /* Заголовок названия серии */
            .gpbx-episode-card__title {
                font-size: 15px;
                font-weight: bold;
                color: #fff;
                margin: 0 0 6px 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            /* Описание серии на 3 строки */
            .gpbx-episode-card__description {
                font-size: 12px;
                color: #b3b3b3;
                margin: 0;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                line-height: 1.4;
                height: 50px;
            }
            
            /* Стиль фокуса при выборе пульта ДУ */
            .gpbx-episode-card.focus {
                background: rgba(255, 255, 255, 0.12) !important;
                border-color: #ffffff !important;
                transform: scale(1.04);
                box-shadow: 0 10px 25px rgba(0,0,0,0.6);
            }
        `;
        $('head').append('<style>' + css + '</style>');
    }

    // Ожидание полной инициализации системы Lampa
    if (window.Lampa) initTilesDesign();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') initTilesDesign(); });
})();
