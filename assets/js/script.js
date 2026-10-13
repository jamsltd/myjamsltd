/* ========================================================================= */
/*	Page Preloader
/* ========================================================================= */

$(window).on('load', function () {
	$('.preloader').fadeOut(100);
});

jQuery(function ($) {
	"use strict";

	/* ========================================================================= */
	/*	lazy load initialize
	/* ========================================================================= */

	const observer = lozad(); // lazy loads elements with default selector as ".lozad"
	observer.observe();

	/* ========================================================================= */
	/*	Magnific popup
	/* =========================================================================  */
	$('.image-popup').magnificPopup({
		type: 'image',
		removalDelay: 160, //delay removal by X to allow out-animation
		callbacks: {
			beforeOpen: function () {
				// just a hack that adds mfp-anim class to markup
				this.st.image.markup = this.st.image.markup.replace('mfp-figure', 'mfp-figure mfp-with-anim');
				this.st.mainClass = this.st.el.attr('data-effect');
			}
		},
		closeOnContentClick: true,
		midClick: true,
		fixedContentPos: false,
		fixedBgPos: true
	});

	/* ========================================================================= */
	/*	Portfolio Filtering Hook
	/* =========================================================================  */

	var $portfolioFilter = $('.portfolio-filter');
	var $portfolioItems = $('.shuffle-wrapper .shuffle-item');
	if ($portfolioFilter.length && $portfolioItems.length) {
		function filterPortfolioItems(filterValue) {
			$portfolioItems.each(function () {
				var groups = $(this).data('groups') || [];
				var shouldShow = filterValue === 'all' || groups.indexOf(filterValue) !== -1;
				$(this).toggle(shouldShow);
			});
		}

		$portfolioFilter.on('click', '.btn', function (evt) {
			evt.preventDefault();

			var $button = $(this);
			var $input = $button.find('input[name="shuffle-filter"]');
			var filterValue = $input.val();

			$portfolioFilter.find('.btn').removeClass('active');
			$button.addClass('active');
			$portfolioFilter.find('input[name="shuffle-filter"]').prop('checked', false);
			$input.prop('checked', true);

			filterPortfolioItems(filterValue);
		});
	}

	$('[data-comparison-slider]').each(function () {
		var slider = this;
		var range = slider.querySelector('.comparison-slider__range');

		function updateSlider() {
			slider.style.setProperty('--position', range.value + '%');
		}

		range.addEventListener('input', updateSlider);
		updateSlider();
	});

	/* ========================================================================= */
	/*	Testimonial Carousel
	/* =========================================================================  */

	$("#testimonials").slick({
		infinite: true,
		arrows: false,
		autoplay: true,
		autoplaySpeed: 4000
	});

	/* ========================================================================= */
	/*	animation scroll js
	/* ========================================================================= */



	// Use the actual sticky header height and preserve native fragment navigation.
	$('nav a, .page-scroll').on('click', function (event) {
		if (this.hash && location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && location.hostname === this.hostname) {
			var target = document.getElementById(this.hash.slice(1));
			if (target) {
				event.preventDefault();
				var hash = this.hash;
				function navigateToSection() {
					var headerHeight = $('.navbar').outerHeight() || 100;
					window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - headerHeight - 16,
						behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
					history.pushState(null, '', hash);
					target.setAttribute('tabindex', '-1');
					target.focus({ preventScroll: true });
				}
				var menu = $('#navigation');
				if (menu.hasClass('show') && $('.navbar-toggler').is(':visible')) {
					menu.one('hidden.bs.collapse', navigateToSection).collapse('hide');
				} else {
					navigateToSection();
				}
			}
		}
	});

	/* ========================================================================= */
	/*	counter up
	/* ========================================================================= */
	function counter() {
		var oTop;
		if ($('.count').length !== 0) {
			oTop = $('.count').offset().top - window.innerHeight;
		}
		if ($(window).scrollTop() > oTop) {
			$('.count').each(function () {
				var $this = $(this),
					countTo = $this.attr('data-count');
				$({
					countNum: $this.text()
				}).animate({
					countNum: countTo
				}, {
					duration: 1000,
					easing: 'swing',
					step: function () {
						$this.text(Math.floor(this.countNum));
					},
					complete: function () {
						$this.text(this.countNum);
					}
				});
			});
		}
	}
	$(window).on('scroll', function () {
		counter();
	});

});
