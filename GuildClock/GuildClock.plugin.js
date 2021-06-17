/**
 * @name GuildClock
 * @author Doggybootsy
 * @description Adds a clock in the guild's column
 * @version 1
 * @source https://github.com/doggybootsy/BDPlugins/
 * @website https://doggybootsy.github.io/
 */

module.exports = class GuildClock{
    getName() {
      return "Guild Clock";
    }
    
    start() {
        // Css | Can easily get changed to other apis
        BdApi.injectCSS(
            "GuildClock",
            '#guildclock{color: var(--text-normal); text-align: center; font-size: 1rem} #guildclock::after{content: " " attr(pm_am);}#guildclock.sticky{position: sticky;top: 0;z-index: 1;background-color: var(--background-tertiary);padding-top: 4px; padding-bottom: 8px; margin: 0;}'
        );
        
        // Add Attribute
        document.getElementsByClassName('guilds-1SWlCJ')[0].setAttribute('guildclock','');
        // Remove extra guildclock element
        if(document.getElementsByClassName('guilds-1SWlCJ')[0].innerHTML.includes('id="guildclock"')){
            document.querySelectorAll('#guildclock').forEach(e => {
                e.remove();
            });
        }
        // Create Element
        document.querySelector('[guildclock] .tutorialContainer-2sGCg9').insertAdjacentHTML('afterend', '<div id="guildclock" class="listItem-GuPuDH"></div>');
        // Time stuff
        function GuildClock_time_stuff(){
            const GuildClock_time = new Date();
            const GuildClock_time_Hour = GuildClock_time.getHours() > 12 ? GuildClock_time.getHours() - 12 : GuildClock_time.getHours();
            const GuildClock_time_Minute = (GuildClock_time.getMinutes()<10?'0':'') + GuildClock_time.getMinutes();
            // Insert time
            document.getElementById('guildclock').innerText = GuildClock_time_Hour+':'+GuildClock_time_Minute;
            if(GuildClock_time.getHours() >= 12 ? "PM" : "AM" == 'PM'){
                document.getElementById('guildclock').setAttribute('pm_am','pm');
            } else{
                document.getElementById('guildclock').setAttribute('pm_am','am');
            }
        }
        setInterval(GuildClock_time_stuff, 10000);
        // Add copy time
        setTimeout(function(){
            document.querySelector('#guildclock').addEventListener("click", () => {
                const GuildClock_copy_string = document.getElementById('guildclock').innerText+document.getElementById('guildclock').getAttribute('pm_am')
                if (!GuildClock_copy_string) return;
                const GuildClock_copy_element = document.createElement('textarea');
                if (!GuildClock_copy_element) return;
                GuildClock_copy_element.value = GuildClock_copy_string;
                GuildClock_copy_element.setAttribute('readonly', '');
                GuildClock_copy_element.style.position = 'absolute';
                GuildClock_copy_element.style.left = '-9999px';
                document.body.appendChild(GuildClock_copy_element);
                GuildClock_copy_element.select();
                document.execCommand('copy');
                document.body.removeChild(GuildClock_copy_element);
            })
        }, 1000);
    }
    stop() {
        // Remove Attribute
        document.getElementsByClassName('guilds-1SWlCJ')[0].removeAttribute('guildclock');
        // hide Element
        document.getElementById('guildclock').style.display = "none";
        // Remove css
        document.querySelector('style#GuildClock').remove()
        // remove copy time
        document.querySelector('#guildclock').removeEventListener("click", () => {
            const GuildClock_copy_string = document.getElementById('guildclock').innerText+document.getElementById('guildclock').getAttribute('pm_am')
            const GuildClock_copy_element = document.createElement('textarea');
            GuildClock_copy_element.value = GuildClock_copy_string;
            GuildClock_copy_element.setAttribute('readonly', '');
            GuildClock_copy_element.style.position = 'absolute';
            GuildClock_copy_element.style.left = '-9999px';
            document.body.appendChild(GuildClock_copy_element);
            GuildClock_copy_element.select();
            document.execCommand('copy');
            document.body.removeChild(GuildClock_copy_element);
        })
    }
}
