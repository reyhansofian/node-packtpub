const cheerio = require('cheerio');
const ora = require('ora');
const request = require('request');
const requestPromise = require('request-promise');
const emoji = require('node-emoji');

class Crawler {
  constructor(config = {}) {
    this.config = config;
    this.baseUrl = 'https://www.packtpub.com';
    this.cookieJar = request.jar();
    this.spinner = ora({
      spinner: 'arc',
    });
  }

  login() {
    return this.doRequest('/packt/offers/free-learning')
      .then(($) => {
        const $form = $('#packt-user-login-form');
        const data = $form
            .serializeArray()
            .reduce((prev, curr) => Object.assign(prev, { [curr.name]: curr.value }), {});

        data.email = this.config.email;
        data.password = this.config.password;
        data.op = 'Login';

        return this.doRequest(
          '/packt/offers/free-learning',
          $form.attr('method'),
          data,
          {
            resolveWithFullResponse: true,
            transform: null,
          }
        );
      })
      .then(body => cheerio.load(body.body))
      .catch((e) => {
        if (e.response && e.response.headers && e.response.headers.location === 'https://www.packtpub.com/packt/offers/free-learning') {
          return this.doRequest(e.response.headers.location);
        }

        throw e;
      });
  }

  doRequest(requestUri, requestMethod = 'get', data = {}, requestOptions = {}) {
    let uri;

    if (requestUri.indexOf(this.baseUrl) !== 0) {
      uri = `${this.baseUrl}${requestUri}`;
    }

    const options = Object.assign({
      uri,
      jar: this.cookieJar,
      transform: body => cheerio.load(body, {
        normalizeWhitespace: true,
      }),
    }, requestOptions);

    if (requestMethod.toLowerCase() === 'post') {
      options.method = 'post';
      options.form = data;
    }

    return requestPromise(options);
  }

  fetchDealOfTheDay() {
    this.spinner.text = 'Fetching deal of the day...';
    this.spinner.start();

    return this.doRequest('/packt/offers/free-learning')
      .then(($) => {
        this.spinner.stopAndPersist({
          symbol: `${emoji.get('coffee')} `,
        });

        const $dealOfTheDay = $('#deal-of-the-day');
        const bookTitle = $dealOfTheDay.find('.dotd-title').children().html().trim();
        const bookSummary = $dealOfTheDay.find('.dotd-main-book-form.cf').prev().html().trim();
        const bookImageUrl = $dealOfTheDay
          .find('.bookimage.imagecache.imagecache-dotd_main_image')
          .first()
          .attr('src');

        this.spinner.text = `Current deal of the day title is '${bookTitle}'`;
        this.spinner.start();
        this.spinner.stopAndPersist({
          symbol: `${emoji.get('zap')} `,
        });

        return {
          bookTitle,
          bookSummary,
          bookImage: `https:${bookImageUrl}`,
        };
      });
  }
}

const crawler = new Crawler();

crawler.fetchDealOfTheDay()
  .then((res) => {
    console.log(res);
  });
