(function () {
    'use strict';

    function initMobileSelectOverride() {
        if (!window.Lampa || !window.Lampa.Select) return;

        // Подключаем адаптивные мобильные стили для плиток
        injectMobileSelectCSS();

        // Делаем копию оригинальной функции Лампы, чтобы не сломать её для обычных меню
        var originalSelectShow = window.Lampa.Select.show;

        // Переопределяем функцию вывода списков
        window.Lampa.Select.show = function (object) {
            // Проверяем, содержит ли открываемое окно список серий сериала
            var isEpisodeList = object && object.items && object.items.some(function(item) {
                var title = (item.title || '').toLowerCase();
                return title.indexOf('серия') > -1 || title.indexOf('эпизод') > -1 || title.match(/\d+\s+сер/i);
            });

            // Если это список серий, перестраиваем его дизайн в горизонтальные плитки
            if (isEpisodeList && object.items) {
                // Модифицируем заголовки и структуру каждого элемента перед отправкой на экран
                object.items.forEach(function(item, index) {
                    var epNum = index + 1;
                    var origTitle = item.title || `${epNum} серия`;
                    var duration = item.subtitle || '— мин.';

                    // Подменяем текст элемента на кастомный HTML-каркас плитки, как на фото
                    item.title = `
                        <div class="m-select-tile">
                            <div class="m-select-tile__preview">
                                <img src="https://lampa.mx" class="m-select-tile__img" />
                                <div class="m-select-tile__duration">${duration}</div>
                            </div>
                            <div class="m-select-tile__meta">
                                <div class="m-select-tile__tags">
                                    <span class="m-tile-tag tag-hdr">HDR 10+</span>
                                    <span class="m-tile-tag tag-codec">H.265</span>
                                </div>
                                <h4 class="m-select-tile__name">${origTitle}</h4>
                                <p class="m-select-tile__desc">Тапните для запуска онлайн-просмотра</p>
                            </div>
                        </div>
                    `;
                    // Очищаем оригинальный подзаголовок, так как мы его упаковали внутрь плитки
                    item.subtitle = ''; 
                });

                // Добавляем маркер-класс к окну, чтобы CSS сделал его горизонтальным скроллом
                var originalOnRender = object.onRender;
                object.onRender = function(html) {
                    html.addClass('m-select-tiles-window');
                    html.find('.select__items, .scroll__content, .scroll').addClass('m-select-tiles-list');
                    if (originalOnRender) originalOnRender(html);
                };
            }

            // Вызываем оригинальный метод Лампы с нашими измененными плитками
            originalSelectShow.call(window.Lampa.Select, object);
        };
    }

    function injectMobileSelectCSS() {
        var css = `
            /* Превращаем вертикальное мобильное меню Лампы в горизонтальную скролл-ленту */
            .m-select-tiles-window .m-select-tiles-list {
                display: flex !important;
                flex-direction: row !important;
                overflow-x: auto !important;
                overflow-y: hidden !important;
                gap: 15px !important;
                padding: 15px !important;
                white-space: nowrap !important;
                -webkit-overflow-scrolling: touch !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            
            /* Убираем стандартные длинные полосы строк Лампы */
            .m-select-tiles-window .select__item, 
            .m-select-tiles-window .scroll__content > div {
                background: none !important;
                border: AppColor !important;
                padding: 0 !important;
                margin: 0 !important;
                display: block !important;
                width: auto !important;
            }
            
            /* Создаем саму карточку-плитку для телефона */
            .m-select-tile {
                display: flex !important;
                flex-direction: column !important;
                width: 250px !important;
                height: 215px !important;
                background: rgba(255, 255, 255, 0.05) !important;
                border-radius: 12px !important;
                overflow: hidden !important;
                border: 1px solid rgba(255, 255, 255, 0.08) !important;
                box-sizing: border-box !important;
            }
            
            .m-select-tile__preview {
                position: relative !important;
                width: 100% !important;
                height: 125px !important;
                background: #121212 !important;
            }
            
            .m-select-tile__img {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
            }
            
            .m-select-tile__duration {
                position: absolute !important;
                bottom: 6px !important;
                right: 6px !important;
                background: rgba(0, 0, 0, 0.8) !important;
                padding: 2px 6px !important;
                border-radius: 4px !important;
                font-size: 10px !important;
                color: #fff !important;
            }
            
            .m-select-tile__meta {
                padding: 10px !important;
                white-space: normal !important;
                text-align: left !important;
            }
            
            .m-select-tile__tags {
                display: flex !important;
                gap: 5px !important;
                margin-bottom: 5px !important;
            }
            
            .m-tile-tag {
                font-size: 9px !important;
                font-weight: bold !important;
                padding: 1px 4px !important;
                border-radius: 2px !important;
            }
            .tag-hdr { background: #ff9800 !important; color: #000 !important; }
            .tag-codec { background: #2196f3 !important; color: #fff !important; }
            
            .m-select-tile__name {
                font-size: 13px !important;
                font-weight: bold !important;
                color: #fff !important;
                margin: 0 0 2px 0 !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
            }
            
            .m-select-tile__desc {
                font-size: 11px !important;
                color: #909090 !important;
                margin: 0 !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
                line-height: 1.3 !important;
            }
            
            /* Визуальный отклик при нажатии на плитку пальцем */
            .m-select-tiles-window .focus .m-select-tile,
            .m-select-tile:active {
                background: rgba(255, 255, 255, 0.15) !important;
                border-color: #ffffff !important;
            }
        `;
        $('head').append('<style>' + css + '</style>');
    }

    // Инициализация при полной готовности Лампы
    if (window.Lampa) initMobileSelectOverride();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') initMobileSelectOverride(); });
})();
