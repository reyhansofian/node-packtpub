const Promise = require('bluebird');
const cheerio = require('cheerio');
const ora = require('ora');
const request = require('request');
const requestPromise = require('request-promise');
const emoji = require('node-emoji');
const fs = require('fs');
const mkdirp = require('mkdirp');

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
    this.spinner.text = 'Logging you in...';
    this.spinner.start();

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
            followAllRedirects: false,
          }
        );
      })
      .then(($) => {
        this.spinner.stopAndPersist({
          text: 'Logged in successfully',
          symbol: `${emoji.get('tada')} `,
        });

        return $;
      })
      .catch((e) => {
        if (e.response && e.response.headers && e.response.headers.location === 'https://www.packtpub.com/packt/offers/free-learning') {
          return this.doRequest(e.response.headers.location);
        }

        throw e;
      });
  }

  download(book, dirPath = '') {
    return Promise.map(book.bookDownloadUrls, (bookUrl) => {
      const downloadRequest = request({
        uri: bookUrl.url,
        jar: this.cookieJar,
      });
      const dir = `${process.cwd()}/${!dirPath ? 'downloads' : dirPath}`;

      mkdirp(dir, (err) => {
        if (err) throw new Error('Error while looking for directory path');

        downloadRequest.pipe(fs.createWriteStream(`${dir}/${book.bookTitle}.${bookUrl.type}`));
        downloadRequest.on('end', () => {
          this.spinner.stopAndPersist({
            text: `Successfully download the ${book.bookTitle}.${bookUrl.type}`,
            symbol: `${emoji.get('coffee')} `,
          });

          Promise.resolve(`${dir}/${book.bookTitle}.${bookUrl.type}`);
        });
      });
    });
  }

  doRequest(requestUri, requestMethod = 'get', data = {}, requestOptions = {}) {
    let uri = this.baseUrl;

    if (requestUri.indexOf(this.baseUrl) !== 0) {
      uri += `${requestUri}`;
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
        const $claimButton = $dealOfTheDay.find('.dotd-main-book-form.cf');
        const bookTitle = $dealOfTheDay.find('.dotd-title').children().html().trim();
        const bookSummary = $claimButton.prev().html().trim();
        const bookImageUrl = $dealOfTheDay
          .find('.bookimage.imagecache.imagecache-dotd_main_image')
          .first()
          .attr('src');
        const claimUrl = $claimButton.find('.float-left.free-ebook').children().attr('href');

        this.spinner.text = `Current deal of the day title is '${bookTitle}'`;
        this.spinner.start();
        this.spinner.stopAndPersist({
          symbol: `${emoji.get('zap')} `,
        });

        return {
          bookTitle,
          bookSummary,
          bookImage: `https:${bookImageUrl}`,
          claimUrl,
        };
      })
      .then((result) => {
        const { bookTitle, bookSummary, bookImage, claimUrl } = result;
        const nid = claimUrl.split('/')[2];

        this.spinner.text = 'Downloading deal of the day ebook...';
        this.spinner.start();

        return this.doRequest(claimUrl, 'get', null, {
          followAllRedirects: false,
        })
          .then(() => this.doRequest('/account/my-ebooks'))
          .then(($) => {
            const $productLine = $('.product-line');
            const $dealItemId = $productLine.filter((i, el) => $(el).attr('nid') === nid);
            const bookDownloadUrls = [];

            $dealItemId
              .find('.download-container.cf')
              .last()
              .find('a')
              .each((i, el) => {
                this.config.fileType.forEach((type) => {
                  if ($(el).find('.fake-button.large.w-quarter').attr('format') === type) {
                    bookDownloadUrls.push({
                      type,
                      url: `${this.baseUrl}${$(el).attr('href')}`,
                    });
                  }
                });
              });

            return {
              bookTitle,
              bookSummary,
              bookImage,
              bookDownloadUrls,
            };
          });
      });
  }

  downloadDealOfTheDay() {
    return this.login()
      .then(() => this.fetchDealOfTheDay())
      .then(res => this.download(res))
      .catch((err) => {
        console.log(err);
      });
  }
}

module.exports = Crawler;
