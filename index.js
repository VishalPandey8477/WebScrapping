import puppeteer from "puppeteer";
import XLSX from "xlsx";

let dataForTransport = [];
let counter = 0;

(async () => {
    try {

        // Some predefined data for the Filters
        let countryName = "India"
        let industryName = "Education"
        let numberOfCompanies = 20
        let outputExcelFileName = "Companies"

        // Opening Chromium browser, which is default for the puppeteer
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--incognito'],
            slowMo: 30,
            defaultViewport: { width: 1280, height: 1024 }

        })

        // Openning page in the browser, with the provided link
        let page = await browser.newPage();
        await page.goto("https://www.linkedin.com/uas/login?session_redirect=https%3A%2F%2Fwww.linkedin.com%2Ffeed%2F")


        console.log("Linkedin Opened in the browser");


        // Every where "focus" is used to point the field, whos id is passed
        // Keyboard.type is used to type in that focused field
        await page.focus('input[id = "username"]')
        await page.keyboard.type("sakshibuy13@gmail.com")

        console.log("Email Written");

        await page.focus('input[id = "password"]')
        await page.keyboard.type("12071998")

        console.log("Password Written");

        // Enter is pressed after the data filled
        await page.keyboard.press('Enter')

        // Waiting for the page to be load
        await page.waitForNavigation();

        console.log("Id logged in");

        // WaitForSelector is used to wait for the element to be load
        await page.waitForSelector(".search-global-typeahead__input");
        await page.type(".search-global-typeahead__input", "education")
        await page.keyboard.press('Enter')

        console.log("Education is searched");


        // Storing the filters and then searching the companies filter in the list
        await page.waitForSelector('.search-reusables__primary-filter');
        const button = await page.$$('.search-reusables__primary-filter button')
        for (let i = 0; i < button.length; i++) {
            const data = await page.evaluate(element => element.textContent, button[i])
            if (data.trim() == "Companies") {
                await button[i].click()
                break
            }

        }


        // --------------------------------------------------Filter Location---------------------------------------------

        // Now choosing the fiters 
        // First selcting the location filter
        const Locations = await page.waitForSelector('#searchFilter_companyHqGeo');
        await Locations.click()

        await page.waitForSelector('input[placeholder="Add a location"]')
        await page.focus('input[placeholder="Add a location"]')
        const inputBox = await page.$('input[placeholder="Add a location"]')
        await page.keyboard.type("India", { delay: 500 })


        console.log("Location Filter is added");

        // After typing india, getting the details from the below div which contains the checkbox
        const locationid = await page.evaluate(element => element.getAttribute('aria-owns'), inputBox)
        await page.waitForSelector(`#${locationid}`)
        const locationDropDown = await page.$(`#${locationid}`)
        const locationData = await page.evaluate(element => element.innerHTML, locationDropDown)
        const spans = await page.$$('.search-typeahead-v2__hit-text');
        spans.forEach(async (items) => {
            const spansContent = await page.evaluate(element => element.textContent, items, { delay: 500 })

            if (spansContent.trim() == countryName) {
                await items.click()
            }
        })

        // Clicking the show result, to apply the filter 
        const showResultOfLocation = await page.waitForSelector('button[data-control-name="filter_show_results"]')
        await showResultOfLocation.click()


        console.log("Location Filter Applied");



        // -----------------------------------------------Filter Industry----------------------------------------


        const industry = await page.waitForSelector("#searchFilter_industryCompanyVertical")
        await industry.click()

        await page.focus('input[placeholder="Add an industry"]')
        const industryInputBox = await page.$('input[placeholder="Add an industry"]')
        await page.keyboard.type("Education", { delay: 200 })

        console.log("Industry filter entred");

        const industryId = await page.evaluate(element => element.getAttribute('aria-owns'), industryInputBox)
        await page.waitForSelector(`#${industryId}`)
        const industryDropDown = await page.$(`#${industryId}`)
        const industryData = await page.evaluate(element => element.innerHTML, industryDropDown)
        const industrySpans = await page.$$('.search-typeahead-v2__hit-text');

        industrySpans.forEach(async (items) => {
            const spansContent = await page.evaluate(element => element.textContent, items, { delay: 500 })
            if (spansContent.trim() == industryName) {
                await items.click()
            }
        })

        await page.waitForSelector('button[data-control-name="filter_show_results"]')
        const industryButton = await page.$$('button[data-control-name="filter_show_results"]')
        await industryButton[1].click()

        console.log("Industry filert apllied");



        // ---------------------------------------------For Company Size--------------------------------------

        const companySize = await page.waitForSelector('button[id="searchFilter_companySize"]')
        await companySize.click()

        const sizeCategory = await page.waitForSelector('input[id="companySize-D"]')
        await sizeCategory.click()


        await page.waitForSelector('button[data-control-name="filter_show_results"]')
        const companySizeButton = await page.$$('button[data-control-name="filter_show_results"]')
        await companySizeButton[2].click()

        console.log("Company Size selected");


        // -----------------------------------------Get list of the Company----------------------------------------


        console.log("Started geeting the data of the Companies");
        // dataForTranspot is and array which contains the data of the companies in the object form
        // NUmber of Companies is the limit till which we want the data
        while (dataForTransport.length < numberOfCompanies) {

            // Getting all the companies list on the current page
            await page.waitForSelector('.reusable-search__entity-result-list')
            const listOfCompanies = await page.$('.reusable-search__entity-result-list')

            // Crating an Array links with the element  of every profile which contains the link of the profile and  has the class name .scale-down
            const links = await listOfCompanies.$$('.scale-down')

            for (const iterator of links) {

                // To print the number of companies in the terminal
                counter++;
                console.log("NUmber: " + counter);

                // Getting the profile link out of every element in the array links
                let src = await iterator.evaluate(element => element.getAttribute('href'), iterator)

                // Adding the about/ in the link to directly open the about profile of the current company, cause all data is in the about page
                src = src + "about/"

                // Opening another page with the profile link of the current company
                let page2 = await browser.newPage();
                await page2.goto(src)

                // Creating an object to store tha required data from the about page of the company
                const pageData = {
                    "Name": null,
                    "Website": null,
                    "Industry": null,
                    "Company size": null,

                }


                // Selecting the h1 tag to get the Name of the Comapany
                await page2.waitForSelector('h1')
                let titlepart = await page2.$('h1')
                let titleContent = await page2.evaluate(element => element.textContent, titlepart)
                pageData["Name"] = titleContent.trim()


                //Getting the dl tag which contains all the list options in which required data is present
                await page2.waitForSelector('dl')
                const dl = await page2.$('dl')

                // Creating an array of elements which have the dd tag
                const allDd = await dl.$$('dd')

                // Getting all the headings like , Website, Company-Size, Type in an array using dd
                const headings = await page2.$$('dt')
                const headingsData = await page2.$$('dd');


                // Matching the headings with the required part and storing the data into the object with specifed key
                for (let i = 0; i < headings.length; i++) {
                    let itemsData = await page2.evaluate(element => element.textContent.trim(), headings[i]);

                    if (itemsData.trim() == "Website") {
                        let itemsValue = await page2.evaluate(element => element.textContent, headingsData[i])
                        pageData[itemsData] = itemsValue.trim();
                    }
                    if (itemsData.trim() == "Industry") {
                        let itemsValue = await page2.evaluate(element => element.textContent, headingsData[i])
                        pageData[itemsData] = itemsValue.trim();
                    }
                    if (itemsData.trim() == "Company size") {
                        let itemsValue = await page2.evaluate(element => element.textContent, headingsData[i])
                        pageData[itemsData] = itemsValue.trim();
                    }
                }


                // Printing the Data in the object in the Output screen
                console.log(pageData);

                // Adding the object into the Array
                dataForTransport.push(pageData)

                // Closing the current company page
                await page2.close();
            }

            // Checking for the Number of companies data
            if (dataForTransport.length > numberOfCompanies) {
                console.log("done");
                break
            }

            // Clicking on the next page 
            await page.waitForSelector('button[aria-label = "Next"]');
            let nextPage = await page.$('button[aria-label = "Next"]');
            await nextPage.click();

        }

        // Sign to check that the program is comnpleted 
        console.log("Done");

        // Calling fuction save to Excel and paasing the array which a speciefed file name
        saveToExcel(dataForTransport, outputExcelFileName)



        // Closing the browser
        await browser.close()


    }
    catch (e) {
        console.log(e)

    }

})();



// Converting the array into a Excel file using the xlsx library in node.js
function saveToExcel(data, filename) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}data.xlsx`)
    console.log("Excel File Created");
}

